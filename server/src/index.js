import { createApp } from './app.js';

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`tabulens api on http://localhost:${PORT}`);
  console.log(`allowed origins: ${app.locals.allowedOrigins.join(', ')}`);
});
