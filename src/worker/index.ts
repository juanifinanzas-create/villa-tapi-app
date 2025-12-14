export default {
  async fetch(request: Request, env: any, ctx: any) {
    return new Response("Worker activo", { status: 200 });
  },
};
