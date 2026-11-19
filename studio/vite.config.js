import {defineConfig} from "vite";
import {resolve} from "node:path";
export default defineConfig({
  build:{
    rollupOptions:{
      input:{
        home:resolve(import.meta.dirname,"index.html"),
        studio:resolve(import.meta.dirname,"app.html"),
        studioV2:resolve(import.meta.dirname,"studio-v2.html"),
        privacy:resolve(import.meta.dirname,"privacy.html")
      }
    }
  }
});
