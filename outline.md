## 🟢 STEP

```tsx
let animatedText = useAnimatedText(text);

function useAnimatedText(text: string) {
  return text;
}

// And default to hello world, to have something to play with
let [text, setText] = useState("Hello world");
```

## 🟢 STEP

How to animate?

```tsx
function useAnimatedText(text: string) {
  let [cursor, setCursor] = useState(0);

  return text.slice(0, 4);
}
```

## 🟢 STEP

```tsx
function useAnimatedText(text: string) {
  let [cursor, setCursor] = useState(0);

  useEffect(() => {
    animate(0, text.length, {
      onUpdate(latest) {
        console.log(latest);
      },
    });
  }, []);

  return text.slice(0, cursor);
}
```

Strict mode!

```tsx
useEffect(() => {
  console.log("effect");
  let controls = animate(0, text.length, {
    onUpdate(latest) {
      console.log(latest);
    },
  });

  return () => controls.stop();
}, []);
```

Now in business.

## 🟢 STEP

Now let's update our state. Let's math.floor it.

```tsx
function useAnimatedText(text: string) {
  let [cursor, setCursor] = useState(8);

  useEffect(() => {
    let controls = animate(0, text.length, {
      duration: 2,
      // Play with this
      ease: "linear",
      onUpdate(latest) {
        setCursor(Math.floor(latest));
      },
    });

    return () => controls.stop();
  }, [text.length]);

  return text.slice(0, cursor);
}
```

## 🟢 STEP

Looks good! Let's go back to empty string and try out streaming.

Somethings happening... slow things down

```tsx
let delay = 2000;
let characters = 50;
```

Starting from 0 each time. Need some memory...

MotionValue!

```tsx
function useAnimatedText(text: string) {
  let animatedCursor = useMotionValue(0);
  let [cursor, setCursor] = useState(8);

  useEffect(() => {
    let controls = animate(animatedCursor, text.length, {
      duration: 2,
      ease: "linear",
      onUpdate(latest) {
        setCursor(Math.floor(latest));
      },
    });

    return () => controls.stop();
  }, [animatedCursor, text.length]);

  return text.slice(0, cursor);
}
```

So cool, it "catches up".

```tsx
let delay = 250;
let characters = 50;

duration: 8,
ease: "easeOut",
```

## 🟢 STEP

Ok, let's try Reset.

Seems to not work. Well, we have two pieces of state: animatedCursor and cursor.

Let's add a log to render and see what's happening:

```tsx
console.log({ cursor });
```

So, animating from 100 back to 0.

Memory is good when we're appending. But not when we have new text.

How do we know when we have new text? New text doesn't startWiht prev text.

Need new state variable for prevText, and another for whether it's the same text.

```tsx
let [prevText, setPrevText] = useState(text);
let [isSameText, setIsSameText] = useState(false);

if (prevText !== text) {
  setPrevText(text);
  setIsSameText(text.startsWith(prevText));
}
```

Now in the beginning of our effect, we can use it to reset our animated cursor in the case where the text is new:

```tsx
useEffect(() => {
  if (!isSameText) {
    animatedCursor.jump(0);
  }

  // ...
});
```

Now let's look at our logs.

Boom. It works!

## 🟢 STEP

Delimiter maybe.
