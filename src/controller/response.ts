import { logger } from "@utils";



// ====================================>
// ## Response error validation
// ====================================>
export function responseErrorValidation(status: any, errors: Record<string, string[]>) {
  throw status(422, {
    message: "Error: Unprocessable Entity!",
    errors: errors,
  });
}

// ====================================>
// ## Response error
// ====================================>
export function responseError(
  status: any,
  error: any,
  section?: string,
  message?: string,
  debug = (process.env.APP_DEBUG || true)
) {
  logger.error(`Error: ${error}`, { error: error, feature: section });

  if (debug) {
    throw status(500, {
      message  :  message ?? "Error: Server Side Having Problem!",
      error    :  error?.message ?? "unknown",
      section  :  section ?? "unknown",
    });
  }

  throw status(500, {
    message: message ?? "Error: Server Side Having Problem!"
  });
}

// ====================================>
// ## Response Forbidden
// ====================================>
export function responseForbidden(status: any, message?: string) {
  throw status(403, {
    message: message ?? "Access Forbidden!"
  });
}

// ====================================> 
// ## Response record
// ====================================>
export function responseData(status: any, data: any[], totalRow?: number, message?: string) {
  throw status(200, {
    message    :  message ?? (data.length ? "Success" : "Empty data"),
    data       :  data ?? [],
    total_row  :  totalRow ?? null,
  });
}

// ===================================>
// ## Response success
// ===================================>
export function responseSuccess(status: any, data: any, message?: string, code?: 200 | 201) {
  throw status(code || 200, {
    message  :  message ?? "Success",
    data     :  data ?? [],
  });
}

// ===================================>
// ## Response saved record
// ===================================>
export function responseSaved(status: any, data: any, message?: string) {
  throw status(201, {
    message  :  message ?? "Success",
    data     :  data ?? [],
  });
}
