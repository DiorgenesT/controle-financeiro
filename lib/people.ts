import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp,
    orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import { Person } from "@/types";

export async function getPeople(userId: string): Promise<Person[]> {
    const q = query(
        collection(db, "people"),
        where("userId", "==", userId),
        orderBy("name")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Person[];
}

export async function addPerson(userId: string, name: string): Promise<string> {
    const docRef = await addDoc(collection(db, "people"), {
        userId,
        name,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function deletePerson(personId: string): Promise<void> {
    await deleteDoc(doc(db, "people", personId));
}
