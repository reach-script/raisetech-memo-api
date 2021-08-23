import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import ajvKeywords from 'ajv-keywords';
const ajv = new Ajv({ allErrors: true });
ajvKeywords(ajv, ['transform']);
ajvErrors(ajv);

const schema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'ID',
    },
    title: {
      type: 'string',
      description: 'タイトル',
      transform: ['trim'],
      minLength: 1,
    },
    category: {
      type: 'string',
      description: 'カテゴリ(任意の文字列をフロントで設定)',
    },
    description: {
      type: 'string',
      description: '内容(改行を含む(textarea))',
    },
    date: {
      type: 'string',
      description: '日付',
      pattern: '[0-9]{4}/[0-9]{2}/[0-9]{2}',
    },
    mark_div: {
      type: 'number',
      description: 'マークつけるか区分(0:つけない、1:つける)',
    },
  },
  required: ['title'],
  additionalProperties: false,
  errorMessage: {
    required: {
      title: 'タイトルは必須です',
    },
    properties: {
      title: 'タイトルは必須です',
      mark_div: 'マーク区分は数値で入力してください',
      date: '日付の形式が不正です',
    },
  },
};

export const validate = ajv.compile(schema);
