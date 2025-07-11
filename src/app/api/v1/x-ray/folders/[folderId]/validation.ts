import Joi from "joi";

const patch = Joi.object({
  name: Joi.string().required(),
});

export default { patch };
