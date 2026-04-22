"use client";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

export function useAuth(redirectTo: string = "/login") {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push(redirectTo);
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, loading };
}