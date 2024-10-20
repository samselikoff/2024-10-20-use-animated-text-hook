"use client";

import { animate, AnimationPlaybackControls } from "framer-motion";
import {
  ComponentProps,
  createContext,
  Dispatch,
  MutableRefObject,
  RefObject,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

let AutoScrollerContext = createContext<{
  isAutoscrolling: boolean;
  setIsAutoscrolling: Dispatch<SetStateAction<boolean>>;
  scrollContainerRef: RefObject<HTMLDivElement>;
  animationControlsRef: MutableRefObject<AnimationPlaybackControls | undefined>;
}>({
  isAutoscrolling: true,
  setIsAutoscrolling: () => {},
  scrollContainerRef: { current: null },
  animationControlsRef: { current: undefined },
});

export function AutoScroller({ children, ...rest }: ComponentProps<"div">) {
  let scrollContainerRef = useRef<HTMLDivElement>(null);
  let animationControlsRef = useRef<AnimationPlaybackControls>();
  let [isAutoscrolling, setIsAutoscrolling] = useState(true);

  return (
    <AutoScrollerContext.Provider
      value={{
        isAutoscrolling,
        setIsAutoscrolling,
        scrollContainerRef,
        animationControlsRef,
      }}
    >
      <div {...rest}>{children}</div>
    </AutoScrollerContext.Provider>
  );
}

export function AutoScrollerContent({
  children,
  ...rest
}: ComponentProps<"div">) {
  let {
    isAutoscrolling,
    setIsAutoscrolling,
    scrollContainerRef,
    animationControlsRef,
  } = useContext(AutoScrollerContext);

  let contentRef = useRef<HTMLParagraphElement>(null);
  let whiteSpaceRef = useRef<HTMLDivElement>(null);
  let lastScrollTopRef = useRef(0);

  useOnScroll(scrollContainerRef, () => {
    let el = scrollContainerRef.current;
    if (!el) return;

    // If autoscrolling is true and we scrolled up...
    if (isAutoscrolling && el.scrollTop < lastScrollTopRef.current) {
      setIsAutoscrolling(false);
      if (animationControlsRef.current) {
        animationControlsRef.current.stop();
      }

      // If autoscrolling is false and we scrolled to the bottom...
    } else if (
      !isAutoscrolling &&
      el.scrollTop === el.scrollHeight - el.clientHeight
    ) {
      setIsAutoscrolling(true);
    }

    lastScrollTopRef.current = el.scrollTop;
  });

  useOnResize(contentRef, ({ currentHeight, previousHeight }) => {
    let scrollContainerEl = scrollContainerRef.current;
    let whiteSpaceEl = whiteSpaceRef.current;

    if (!scrollContainerEl || !whiteSpaceEl) return;
    if (currentHeight < scrollContainerEl.clientHeight) return;
    if (currentHeight === previousHeight) return;

    let change = currentHeight - previousHeight;
    // Ignore content getting smaller due to resize
    if (change < 0) return;

    let newHeight = whiteSpaceEl.clientHeight - change;

    if (newHeight > 0) {
      whiteSpaceEl.style.height = `${whiteSpaceEl.clientHeight - change}px`;
    } else {
      whiteSpaceEl.style.height = `100px`;
      let scrollContainerEl = scrollContainerRef.current;
      if (scrollContainerEl && isAutoscrolling) {
        let end =
          scrollContainerEl.scrollHeight - scrollContainerEl.clientHeight;

        if (animationControlsRef.current) {
          animationControlsRef.current.stop();
        }

        let controls = animate(scrollContainerEl.scrollTop, end, {
          type: "spring",
          bounce: 0,
          duration: 0.5,
          onUpdate: (latest) => scrollContainerEl.scrollTo({ top: latest }),
        });
        animationControlsRef.current = controls;
      }
    }
  });

  return (
    <div ref={scrollContainerRef} {...rest}>
      <div ref={contentRef}>{children}</div>
      <div ref={whiteSpaceRef} />
    </div>
  );
}

export function AutoScrollerButton({
  children,
  ...rest
}: Omit<ComponentProps<"button">, "onClick">) {
  let {
    isAutoscrolling,
    setIsAutoscrolling,
    scrollContainerRef,
    animationControlsRef,
  } = useContext(AutoScrollerContext);

  function handleClick() {
    setIsAutoscrolling(true);
    let scrollContainerEl = scrollContainerRef.current;
    if (!scrollContainerEl) return;

    let end = scrollContainerEl.scrollHeight - scrollContainerEl.clientHeight;
    let controls = animate(scrollContainerEl.scrollTop, end, {
      type: "spring",
      bounce: 0,
      duration: 0.5,
      onUpdate: (latest) => scrollContainerEl.scrollTo({ top: latest }),
    });
    animationControlsRef.current = controls;
  }

  if (isAutoscrolling) return;

  return (
    <button onClick={handleClick} {...rest}>
      {children}
    </button>
  );
}

function useOnResize(
  ref: MutableRefObject<Element | null>,
  callback: (args: { currentHeight: number; previousHeight: number }) => void,
) {
  // Create a ref to store the observer
  const observer = useRef<ResizeObserver | null>(null);
  const previousHeightRef = useRef<number | null>(null);

  useEffect(() => {
    // Ensure the ref.current is not null before creating the observer
    if (!ref.current) return;

    // Initialize the ResizeObserver with the callback function
    observer.current = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const currentHeight = entry.contentRect.height;

        // Get the previous height; if it's null, initialize it with the current height
        const previousHeight = previousHeightRef.current ?? currentHeight;

        // Update the previous height ref
        previousHeightRef.current = currentHeight;

        // Call the callback with the change in height
        callback({ currentHeight, previousHeight });
      }
    });

    // Start observing the element referenced by ref
    observer.current.observe(ref.current);

    // Cleanup function to disconnect the observer when the component unmounts or ref changes
    return () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null; // Clear the observer ref
      }
    };
  }, [ref, callback]);
}

function useOnScroll<T extends HTMLElement>(
  ref: RefObject<T>,
  callback: (event: Event) => void,
): void {
  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    // Define the scroll event handler
    function handleScroll(event: Event) {
      callback(event);
    }

    // Add the event listener to the element
    element.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener
    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, [ref, callback]);
}
