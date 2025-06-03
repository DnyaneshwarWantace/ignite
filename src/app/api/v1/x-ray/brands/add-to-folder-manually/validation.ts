import Joi from "joi";

const post = Joi.object({
  folderId: Joi.string().required().min(1),
  brandUrl: Joi.string().required().min(1).trim(),
  offset: Joi.number().integer().min(0).optional().default(0),
});

export default { post };
