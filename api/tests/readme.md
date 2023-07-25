## Regenerate the test token

Everything required to regenerate the test token is contained within the test_keys.json.
Use the website https://jwt.io/ to create a new token.
The test_keys.json file contains the required header, body, public and private keys.
On the jwt.io website, with the alg set to RS256 then the public and private test keys can be used to sign the token.
Editing the body and header will regenerate the token in the website's encoded window.
Copy the token and past it into the test_keys.json file replacing VALID_TEST_TOKEN value.