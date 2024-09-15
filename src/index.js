import dotenv from "dotenv"
import connectdb from "./db/index.js";
import { app } from "./aap.js";

dotenv.config({
    path: './env'
})
connectdb()
.then(()=> {
app.listen(process.env.PORT || 8000,()=>{
    console.log(`server is runnign at ${process.env.PORT}`)
})
})
.catch((err)=>{
    console.log("connection failed: " , err);
})