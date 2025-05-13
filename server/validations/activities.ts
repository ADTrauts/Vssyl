import Joi from 'joi';

export const validateActivity = (data: any) => {
  const schema = Joi.object({
    type: Joi.string().required(),
    description: Joi.string().required(),
    metadata: Joi.object().optional()
  });

  return schema.validate(data);
}; 