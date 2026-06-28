import "elysia";
import { Elysia, Context } from "elysia";
import { validate, KeyPermission, ValidationRules, ValidationRule } from "@utils";
import { responseErrorValidation, responseError, responseForbidden, responseData, responseSuccess, responseSaved } from "./response";
import { uploadFile, deleteFile } from "./storage";

declare module "elysia" {
  interface ControllerContext extends Context {
    getQuery                :  {
      paginate            :  number;
      page                :  number;
      sort                :  string[];
      filter              :  Record<string, string>;
      search              :  string;
      searchable          :  string[];
      selectable          :  string[];
      selectableOption    :  string[];
      expand              :  string[];
    };

    responseData            :  (
      data                :  any[],
      totalRow           ?:  number,
      message            ?:  string,
      columns            ?:  string[],
      access             ?:  string[]
    ) => { 
      status                : number; 
      body                  : any 
    };

    validation              :  <T extends object>(rules: Partial<Record<keyof T | string, ValidationRule[] | string>>) => any;
    responseError           :  (error: any, section?: string, message?: string, debug?: boolean) => any;
    responseErrorValidation :  (errors: Record<string, string[]>) => any;
    responseSaved           :  (data: any, message?: string) => any;
    responseSuccess         :  (data: any, message?: string) => any;
    responseForbidden       :  (message?: string) => any;
    uploadFile              :  (file: File, folder?: string) => Promise<string>;
    deleteFile              :  (filePath: string) => void;
    user                   ?:  any
    permissions            ?:  KeyPermission[],
    payload                 :  Record<string, any>
  }
}

export type ValidationRulesFor<T> = Partial<
  Record<keyof T | string, ValidationRule[] | string>
>

export const controller = (app: Elysia) => app.derive(({ query, body, status }) => ({

  // =====================================>
  // ## Controller: basic fetching data query
  // =====================================>
  getQuery: {
    page              :  query.page              ?   Number(query.page)                                  :    1,
    paginate          :  query.paginate          ?   Number(query.paginate)                              :    10,
    search            :  query.search            ?   query.search                                        :    "",
    sort              :  query.sort              ?   JSON.parse(query.sort)                        :    ["created_at desc"],
    filter            :  query.filter            ?   JSON.parse(query.filter)                      :    [],
    searchable        :  query.searchable        ?   JSON.parse(query.searchable)                  :    [],
    selectable        :  query.selectable        ?   JSON.parse(query.selectable)                  :    [],
    selectableOption  :  query.selectableOption  ?   JSON.parse(query.selectableOption)            :    [],
    expand            :  query.expand            ?   JSON.parse(query.expand)                      :    [],
  },

  // =====================================>
  // ## Controller: validation request body
  // =====================================>
  validation: async <T extends object>(
    rules: Partial<Record<keyof T | string, ValidationRules[] | string>>
  ) => {
    const result = await validate(
      body as Record<string, any>,
      rules as ValidationRules
    )

    if (!result.valid) {
      throw status(422, {
        message: "Error: Unprocessable Entity!",
        errors: result.errors,
      })
    }
  },

  // =====================================>
  // ## Controller: response error validation
  // =====================================>
  responseErrorValidation: (errors: Record<string, string[]>) => responseErrorValidation(status, errors),

  // =====================================>
  // ## Controller: response error
  // =====================================>
  responseError: (error: any, section?: string, message?: string, debug?: boolean) => responseError(status, error, section, message, debug),

  // =====================================>
  // ## Controller: response forbidden
  // =====================================>
  responseForbidden: (message?: string) => responseForbidden(status, message),

  // =====================================>
  // ## Controller: response record
  // =====================================>
  responseData: (data: any[], totalRow?: number, message?: string) => responseData(status, data, totalRow, message),

  // =====================================>
  // ## Controller: response success
  // =====================================>
  responseSuccess: (data: any, message?: string, code?: 200 | 201) => responseSuccess(status, data, message, code),

  // =====================================>
  // ## Controller: response saved record
  // =====================================>
  responseSaved: (data: any, message?: string) => responseSaved(status, data, message),

  // =====================================>
  // ## Controller: upload file
  // =====================================>
  uploadFile,

  // =====================================>
  // ## Controller: delete file
  // =====================================>
  deleteFile,
}));