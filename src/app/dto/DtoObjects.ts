
// данные для поиска данных пользователя
export class SearchValues {
  constructor(readonly searchString: String) {}
}

// ответ от сервера BFF
export class DataResult {
  constructor(readonly data: String) {}
}


// получить все данные пользователя
export class UserProfile {
  constructor(
    readonly givenName: String,
    readonly familyName: String,
    readonly address: String,
    readonly email: String,
    readonly id: String,
) {}
}
