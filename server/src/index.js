import app from './app.js';
import { initializeDatabase } from './database/db.js';

const PORTA = process.env.PORT || 3001;

await initializeDatabase();

app.listen(PORTA, () => {
  console.log(`API rodando em http://localhost:${PORTA}`);
});
