import Joi from "joi";

const get = Joi.object({
  search: Joi.string().allow("").optional(),
});

const post = Joi.object({
  name: Joi.string().required(),
});

const folderValidation = { post, get };

export default folderValidation;
