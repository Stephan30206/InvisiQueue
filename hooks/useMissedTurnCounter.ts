import { useEffect, useState } from "react";

const CALL_TIMEOUT_SECONDS = 30; // Délai avant recul automatique

export function useMissedTurnCounter(isFirstInQueue: boolean, isPresent: boolean) {
  const [secondsLeft, setSecondsLeft] = useState(CALL_TIMEOUT_SECONDS);
  const [showCounter, setShowCounter] = useState(false);

  useEffect(() => {
    if (!isFirstInQueue || isPresent) {
      setShowCounter(false);
      setSecondsLeft(CALL_TIMEOUT_SECONDS);
      return;
    }

    setShowCounter(true);
    setSecondsLeft(CALL_TIMEOUT_SECONDS);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isFirstInQueue, isPresent]);

  const percentage = (secondsLeft / CALL_TIMEOUT_SECONDS) * 100;

  return {
    showCounter,
    secondsLeft,
    percentage,
  };
}
