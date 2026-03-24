import type { Result } from "../result";
import { Ok, Err } from "../result";
import type { DomainError } from "../domain/errors";
import { DomainErrors } from "../domain/errors";
import type { UserRepository } from "../ports/user-repository.port";
import type { EmailValidatorPort } from "../ports/email-validator.port";

export interface ValidateSignupDeps {
  readonly emailValidator: EmailValidatorPort;
  readonly userRepo: UserRepository;
  readonly maxUsers: number;
}

export interface SignupInput {
  readonly email: string;
}

export function createValidateSignup(deps: ValidateSignupDeps) {
  return async (input: SignupInput): Promise<Result<true, DomainError>> => {
    if (deps.emailValidator.isDisposable(input.email)) {
      return Err(DomainErrors.disposableEmail());
    }

    const userCount = await deps.userRepo.count();
    if (userCount >= deps.maxUsers) {
      return Err(DomainErrors.maxUsersReached());
    }

    return Ok(true as const);
  };
}
