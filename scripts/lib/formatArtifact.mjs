import prettier from 'prettier';

export async function serializePrettierJson(value) {
  return prettier.format(JSON.stringify(value, null, 2), {
    parser: 'json',
    printWidth: 100,
  });
}
