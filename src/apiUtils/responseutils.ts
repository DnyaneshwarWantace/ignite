import messages from "./messages";
import statuscodes from "./statuscodes";

export const createResponse = (resData: {
  message?: string;
  payload?: any;
  status?: number;
  pagination?: any;
}) => {
  return Response.json(
    {
      type: "response",
      message: resData.message || messages.SUCCESS,
      payload: resData.payload,
      pagination: resData.pagination || {},
    },
    { status: resData.status || statuscodes.OK }
  );
};

export const createError = (resData: {
  message?: string;
  payload?: any;
  status?: number;
}) => {
  return Response.json(
    {
      type: "error",
      message: resData.message || messages.SUCCESS,
      payload: resData.payload,
    },
    { status: resData.status || statuscodes.BAD_REQUEST }
  );
};
