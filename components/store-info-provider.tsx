"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { StoreInformation } from "@/types";

interface StoreInfoContextType {
  storeInformation: StoreInformation;
  setStoreInformation: React.Dispatch<React.SetStateAction<StoreInformation>>;
  isLoading: boolean;
  hasError: boolean;
}

const StoreInfoContext = createContext<StoreInfoContextType | undefined>(
  undefined
);

export function useStoreInfo() {
  const context = useContext(StoreInfoContext);
  if (context === undefined) {
    throw new Error("useStoreInfo must be used within a StoreInfoProvider");
  }
  return context;
}

interface StoreInfoProviderProps {
  children: React.ReactNode;
  initialStoreInformation: StoreInformation;
}

export default function StoreInfoProvider({
  children,
  initialStoreInformation,
}: StoreInfoProviderProps) {
  const [storeInformation, setStoreInformation] = useState<StoreInformation>(
    initialStoreInformation
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchStoreInformation = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const res = await fetch("/api/store-information", {
          credentials: "include",
        });
        const data = await res.json();

        if (
          typeof data === "object" &&
          data !== null &&
          "multi_language_enabled" in data &&
          typeof data.multi_language_enabled === "boolean"
        ) {
          setStoreInformation(data as StoreInformation);
        } else {
          throw new Error("Invalid store information data");
        }
      } catch (error) {
        console.error("Error fetching store information:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreInformation();
  }, []);

  return (
    <StoreInfoContext.Provider
      value={{ storeInformation, setStoreInformation, isLoading, hasError }}
    >
      {children}
    </StoreInfoContext.Provider>
  );
}
