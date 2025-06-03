import Joi from "joi";

const get = Joi.object({
  search: Joi.string().allow("").optional(),
});

export default { get };
