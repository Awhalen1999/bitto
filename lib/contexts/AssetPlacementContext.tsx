"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface AssetPlacementContextValue {
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string | null) => void;
}

const AssetPlacementContext = createContext<AssetPlacementContextValue | null>(
  null,
);

export function AssetPlacementProvider({ children }: { children: ReactNode }) {
  const [selectedAssetId, setSelectedAssetIdState] = useState<string | null>(
    null,
  );

  const setSelectedAssetId = useCallback((id: string | null) => {
    setSelectedAssetIdState(id);
  }, []);

  return (
    <AssetPlacementContext.Provider
      value={{ selectedAssetId, setSelectedAssetId }}
    >
      {children}
    </AssetPlacementContext.Provider>
  );
}

export function useAssetPlacement(): AssetPlacementContextValue {
  const ctx = useContext(AssetPlacementContext);
  if (!ctx) {
    return {
      selectedAssetId: null,
      setSelectedAssetId: () => {},
    };
  }
  return ctx;
}
