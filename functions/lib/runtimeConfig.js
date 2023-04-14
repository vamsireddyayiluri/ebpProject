export default {
  runtime: {
    env: process.env.NODE_ENV,
  },
  global: {
    key: process.env.GLOBAL_API_KEY,
  },
  google: {
    key: process.env.GLOBAL_GOOGLE_API_KEY,
  },
}
