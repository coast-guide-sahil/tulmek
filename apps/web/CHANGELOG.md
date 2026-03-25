# Changelog

## [0.4.0](https://github.com/coast-guide-sahil/interview-prep/compare/web-v0.3.0...web-v0.4.0) (2026-03-25)


### Features

* verify email via OTP before signup instead of after ([#27](https://github.com/coast-guide-sahil/interview-prep/issues/27)) ([3f3a980](https://github.com/coast-guide-sahil/interview-prep/commit/3f3a98076163a76047ca3dd3ca6ae02f49887592))


### Bug Fixes

* handle Resend API errors instead of silently swallowing them ([#29](https://github.com/coast-guide-sahil/interview-prep/issues/29)) ([c4e6691](https://github.com/coast-guide-sahil/interview-prep/commit/c4e6691708a7a5165f4e974573d109965b99fdf6))
* harden pre-signup OTP flow against brute-force attacks ([#30](https://github.com/coast-guide-sahil/interview-prep/issues/30)) ([55f9c84](https://github.com/coast-guide-sahil/interview-prep/commit/55f9c845615065a60ae95bcfb5f400bfbeb76640))
* redirect to verify-email when sign-up returns null token ([#24](https://github.com/coast-guide-sahil/interview-prep/issues/24)) ([9cadfc1](https://github.com/coast-guide-sahil/interview-prep/commit/9cadfc10cb55c83ae40bc73ab25ae35797dd27e2))
* use connection() to ensure sign-up page reads env at runtime ([#28](https://github.com/coast-guide-sahil/interview-prep/issues/28)) ([fc322ce](https://github.com/coast-guide-sahil/interview-prep/commit/fc322ce29b00aaa011d7296335b1785af108f376))

## [0.3.0](https://github.com/coast-guide-sahil/interview-prep/compare/web-v0.2.0...web-v0.3.0) (2026-03-24)


### Features

* add email OTP verification for new signups ([#22](https://github.com/coast-guide-sahil/interview-prep/issues/22)) ([f5a2b7c](https://github.com/coast-guide-sahil/interview-prep/commit/f5a2b7ca4b5d6e383710266b64429db75e6f8b01))

## [0.2.0](https://github.com/coast-guide-sahil/interview-prep/compare/web-v0.1.2...web-v0.2.0) (2026-03-24)


### Features

* add db:promote-admin CLI for bootstrapping admin users ([#20](https://github.com/coast-guide-sahil/interview-prep/issues/20)) ([f4931e4](https://github.com/coast-guide-sahil/interview-prep/commit/f4931e49badac8e09aba683c98340cbfefe4cc18))

## [0.1.2](https://github.com/coast-guide-sahil/interview-prep/compare/web-v0.1.1...web-v0.1.2) (2026-03-24)


### Bug Fixes

* downgrade eslint to v9 for eslint-config-next 16.2.1 compatibility ([#18](https://github.com/coast-guide-sahil/interview-prep/issues/18)) ([8976539](https://github.com/coast-guide-sahil/interview-prep/commit/89765390e03a8773df553e86916ca10841dadacc))

## [0.1.1](https://github.com/coast-guide-sahil/interview-prep/compare/web-v0.1.0...web-v0.1.1) (2026-03-24)


### Bug Fixes

* address QA, security, and PR review findings ([554944a](https://github.com/coast-guide-sahil/interview-prep/commit/554944a4b76e062e2f844a034bdc4deaf96e8ee3))
* docker best practices - tini, cache mounts, node healthcheck, cap_drop ([7518bbe](https://github.com/coast-guide-sahil/interview-prep/commit/7518bbe502d73a7dc8d5ecbfb17c2fa840185311))
* docker build - set PNPM_HOME for global turbo install, add root .dockerignore ([db9a7f3](https://github.com/coast-guide-sahil/interview-prep/commit/db9a7f38688fd26bc6ea7e9131f8b859f2e36233))
