"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onAuthChange, signOut as authSignOut } from "@/lib/auth";
import { User } from "@/types";

interface AuthContextType {
    firebaseUser: FirebaseUser | null;
    user: User | null;
    loading: boolean;
    isFirstAccess: boolean;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função para obter ou criar dados do usuário
async function getOrCreateUserData(fbUser: FirebaseUser): Promise<User> {
    const docRef = doc(db, "users", fbUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            uid: fbUser.uid,
            email: data.email || fbUser.email || "",
            displayName: data.displayName || fbUser.displayName || fbUser.email?.split("@")[0] || "Usuário",
            photoURL: data.photoURL || fbUser.photoURL || null,
            isFirstAccess: data.isFirstAccess ?? true,
            createdAt: data.createdAt?.toDate() || new Date(),
            subscriptionStatus: data.subscriptionStatus || "active",
            stripeCustomerId: data.stripeCustomerId,
        };
    }

    // Se não existe, criar documento automaticamente
    const newUserData: Omit<User, "uid"> = {
        email: fbUser.email || "",
        displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Usuário",
        photoURL: fbUser.photoURL || null,
        isFirstAccess: true,
        createdAt: new Date(),
        subscriptionStatus: "active",
    };

    await setDoc(docRef, {
        ...newUserData,
        createdAt: serverTimestamp(),
    });

    return {
        uid: fbUser.uid,
        ...newUserData,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFirstAccess, setIsFirstAccess] = useState(false);

    const refreshUser = async () => {
        if (firebaseUser) {
            const userData = await getOrCreateUserData(firebaseUser);
            setUser(userData);
            setIsFirstAccess(userData.isFirstAccess);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthChange(async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                try {
                    const userData = await getOrCreateUserData(fbUser);
                    setUser(userData);
                    setIsFirstAccess(userData.isFirstAccess);
                } catch (error) {
                    console.error("Erro ao buscar dados do usuário:", error);
                    // Mesmo com erro, criar usuário básico para permitir acesso
                    setUser({
                        uid: fbUser.uid,
                        email: fbUser.email || "",
                        displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Usuário",
                        photoURL: fbUser.photoURL || null,
                        isFirstAccess: true,
                        createdAt: new Date(),
                        subscriptionStatus: "active",
                    });
                    setIsFirstAccess(true);
                }
            } else {
                setUser(null);
                setIsFirstAccess(false);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        await authSignOut();
        setFirebaseUser(null);
        setUser(null);
        setIsFirstAccess(false);
    };

    return (
        <AuthContext.Provider
            value={{
                firebaseUser,
                user,
                loading,
                isFirstAccess,
                signOut,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
}
