export const ERROR_MESSAGES = {
  accountNotFound:
    "Error: Account not found: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  constraintViolated:
    "Error Code: ConstraintHasOne. Error Number: 2001. Error Message: A has one constraint was violated.",
  insufficientFunds:
    "Error: Attempt to debit an account but found no record of a prior credit. 0x1",
  invalidAccountData: "Error: invalid account data for instruction",
  customProgram:
    "Error Code: InvalidAmount. Error Number: 6000. Error Message: Amount must be greater than zero.",
  cpiFailure:
    "Error: Cross-program invocation with unauthorized signer or writable account",
  anchorPanic:
    "Program log: AnchorError caused by account: vault. Error Code: AccountDiscriminatorMismatch",
} as const;
