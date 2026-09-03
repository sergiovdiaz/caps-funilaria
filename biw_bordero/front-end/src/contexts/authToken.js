// export async function getToken() {
//   return localStorage.getItem("accessToken");
// }

// authToken.js
let getValidTokenFn = null;

export const setTokenProvider = (fn) => {
  getValidTokenFn = fn;
};

export const getToken = async () => {
  if (!getValidTokenFn) {
    throw new Error("Token provider não definido");
  }
  return await getValidTokenFn();
};
