import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    onAuthStateChanged,
    confirmPasswordReset,
    User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User } from "@/types";

// Senha padrão para novos usuários (fornecida após compra)
export const DEFAULT_PASSWORD = "123456";

// Criar novo usuário
export async function signUp(email: string, displayName: string): Promise<FirebaseUser> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, DEFAULT_PASSWORD);
        const firebaseUser = userCredential.user;

        // Criar documento do usuário no Firestore
        const userData: Omit<User, "uid"> = {
            email: email,
            displayName: displayName,
            photoURL: null,
            isFirstAccess: true,
            createdAt: new Date(),
            subscriptionStatus: "trial",
        };

        await setDoc(doc(db, "users", firebaseUser.uid), {
            ...userData,
            createdAt: serverTimestamp(),
        });

        return firebaseUser;
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        throw error;
    }
}

// Login
export async function signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        throw error;
    }
}

// Logout
export async function signOut(): Promise<void> {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        throw error;
    }
}

// Resetar senha
export async function resetPassword(email: string): Promise<void> {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("Erro ao enviar email de reset:", error);
        throw error;
    }
}

// Alterar senha (para primeiro acesso)
export async function changePassword(
    currentPassword: string,
    newPassword: string
): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("Usuário não autenticado");
    }

    try {
        // Re-autenticar o usuário
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Atualizar senha
        await updatePassword(user, newPassword);

        // Marcar que não é mais primeiro acesso
        await updateDoc(doc(db, "users", user.uid), {
            isFirstAccess: false,
        });
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        throw error;
    }
}

// Obter dados do usuário do Firestore
export async function getUserData(uid: string): Promise<User | null> {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                uid,
                email: data.email,
                displayName: data.displayName,
                photoURL: data.photoURL,
                isFirstAccess: data.isFirstAccess,
                createdAt: data.createdAt?.toDate() || new Date(),
                subscriptionStatus: data.subscriptionStatus || "trial",
                stripeCustomerId: data.stripeCustomerId,
            };
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        throw error;
    }
}

// Verificar se é primeiro acesso
export async function checkFirstAccess(uid: string): Promise<boolean> {
    try {
        const userData = await getUserData(uid);
        return userData?.isFirstAccess ?? true;
    } catch (error) {
        console.error("Erro ao verificar primeiro acesso:", error);
        return true;
    }
}

// Observer de autenticação
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
}

// Confirmar reset de senha
export async function confirmResetPassword(oobCode: string, newPassword: string): Promise<void> {
    try {
        await confirmPasswordReset(auth, oobCode, newPassword);
    } catch (error) {
        console.error("Erro ao confirmar reset de senha:", error);
        throw error;
    }
}
