import { generate2FACode } from '../../server';

describe('generate2FACode', () => {
  it('should generate a 6-digit code', () => {
    const code = generate2FACode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should generate different codes on subsequent calls', () => {
    const code1 = generate2FACode();
    const code2 = generate2FACode();
    expect(code1).not.toBe(code2);
  });
});