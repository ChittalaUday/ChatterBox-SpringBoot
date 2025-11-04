// CSS modules
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// Global CSS imports (side-effect imports)
declare module "*.css";