import Joi from "joi";

const post = Joi.object({
  folderId: Joi.string().required(),
  brandIds: Joi.array().items(Joi.string()).required(),
});

export default { post };
