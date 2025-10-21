/// <reference types="vite/client" />

declare global {
  interface Window {
    Vapi?: any;
  }
}

export {};

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare module "*.gif" {
  const value: string;
  export default value;
}

// Allow using the custom web component <vapi-widget /> in JSX
declare namespace JSX {
  interface IntrinsicElements {
    "vapi-widget": any;
  }
}
