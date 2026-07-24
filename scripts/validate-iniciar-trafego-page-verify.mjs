#!/usr/bin/env node
import {
  analyzeRemoteHtml,
  classifyLandingUrl,
  extractPageIdentityMarker,
  verifyPageIdentity,
} from './lib/iniciar-trafego/page-verifier.mjs';

function fail(msg) {
  console.error(`validate-iniciar-trafego-page-verify: FAIL — ${msg}`);
  process.exit(1);
}

// classifyLandingUrl
if (classifyLandingUrl('http://insecure.example').ok) fail('http deve falhar');
if (classifyLandingUrl('https://pay.hotmart.com/foo?sck=1').ok) fail('checkout host deve ser rejeitado');
if (classifyLandingUrl('https://cdn.example.com/app.js').ok) fail('asset deve ser rejeitado');
if (!classifyLandingUrl('https://landing.example.com/vendas').ok) fail('landing valida deve passar');

// identity
const local = '<html><head><title>Curso X</title></head><body><h1>Curso X</h1><script src="https://connect.facebook.net/en_US/fbevents.js"></script><script>fbq("init","123456789");fbq("track","PageView");</script><a href="https://pay.hotmart.com/x?sck=abc">Buy</a></body></html>';
const remote = local.replace('Curso X', 'Curso X');
const idOk = verifyPageIdentity(local, remote);
if (!idOk.ok) fail('identidade equivalente deve passar');
const idBad = verifyPageIdentity(local, '<html><title>Outro</title></html>');
if (idBad.ok) fail('identidade divergente deve falhar');

// remote pixel/checkout
const checks = analyzeRemoteHtml(local, 'direct_checkout');
if (!checks.pixelOk) fail('pixel remoto deve ser detectado');
if (!checks.checkoutOk) fail('checkout remoto com sck deve ser detectado');
const commented = '<html><!-- fbq( --></html>';
if (analyzeRemoteHtml(commented).pixelOk) fail('pixel so em comentario remoto deve falhar');

// marker helper
if (!extractPageIdentityMarker(local).includes('Curso X')) fail('marker deve incluir title/h1');

console.log('validate-iniciar-trafego-page-verify: PASS (classify + identity + remote pixel/checkout)');
process.exit(0);
