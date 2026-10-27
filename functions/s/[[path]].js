// Share-link preview pages (/s/<id>) live in the dengue-maro-api Worker, like /api/*.
export const onRequest = ({ request, env }) => env.API.fetch(request);
