// Forward /api/* to the dengue-maro-api Worker (service binding API, see wrangler.jsonc).
// The MongoDB code lives there because the Pages build's wrangler can't bundle the driver.
export const onRequest = ({ request, env }) => env.API.fetch(request);
