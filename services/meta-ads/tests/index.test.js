const assert = require('node:assert/strict');
const test = require('node:test');
const { scrubSecrets } = require('../index');

test('scrubs full and shortened token echoes', () => {
  const token = 'EAAVHyhr' + 'x'.repeat(190) + 'ZDZD';
  const output = scrubSecrets(
    `full=${token}\nshort=EAAVHyhr...ZDZD`,
    { ACCESS_TOKEN: token },
  );

  assert.equal(output, 'full=[REDACTED]\nshort=[REDACTED]');
  assert.doesNotMatch(output, /EAAVHyhr|ZDZD/);
});
