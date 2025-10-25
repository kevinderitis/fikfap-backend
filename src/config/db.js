import mongoose from 'mongoose';
const uri = process.env.MONGODB_URI;
mongoose.set('strictQuery', true);
mongoose.connect(uri).then(()=>console.log('[db] conectado')).catch((e)=>{
  console.error('[db] error', e);
  process.exit(1);
});
export default mongoose;
