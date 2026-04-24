const TOKEN_KEY = "igui_auth_token";

export const authToken = {
  get():           string | null { return sessionStorage.getItem(TOKEN_KEY); },
  set(t: string):  void          { sessionStorage.setItem(TOKEN_KEY, t); },
  clear():         void          { sessionStorage.removeItem(TOKEN_KEY); },
};
