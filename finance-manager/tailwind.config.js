/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: Object.fromEntries(
        [
          "background",
          "foreground",
          "card",
          "card-foreground",
          "popover",
          "popover-foreground",
          "primary",
          "primary-foreground",
          "secondary",
          "secondary-foreground",
          "muted",
          "muted-foreground",
          "accent",
          "accent-foreground",
          "destructive",
          "destructive-foreground",
          "border",
          "input",
          "ring",
          "income",
          "expense",
          "warning",
          "warning-foreground",
        ].map((name) => [name, `hsl(var(--${name}) / <alpha-value>)`]),
      ),
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover":
          "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};
