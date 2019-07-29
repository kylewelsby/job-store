if(!process.env.MONGODB_URI) {
  console.error(`\n    ---> You might be missing .env, please define MONGODB_URI <---\n\n`);
  process.exit(1)
}
