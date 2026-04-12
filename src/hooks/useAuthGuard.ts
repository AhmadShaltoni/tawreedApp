import { useAppSelector } from "@/src/store";
import { useCallback, useState } from "react";

/**
 * Hook that provides auth guard functionality for guest mode.
 * Returns a function that checks auth and either runs the callback or shows login modal.
 */
export function useAuthGuard() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (isAuthenticated) {
        callback?.();
        return true;
      }

      setShowLoginModal(true);
      return false;
    },
    [isAuthenticated],
  );

  return {
    isAuthenticated,
    requireAuth,
    showLoginModal,
    setShowLoginModal,
  };
}
