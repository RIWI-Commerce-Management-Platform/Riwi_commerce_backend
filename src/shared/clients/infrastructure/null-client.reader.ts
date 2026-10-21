import { Injectable } from '@nestjs/common';

import { ClientReader, ClientSnapshot } from '../domain/client-reader.js';

// Placeholder implementation while the clients module contract is not available
// . The clients ORM entity exists on branch feat/HU-05 but no
// read service/contract has been published yet.

// 1. Replace this adapter with one that calls the clients module read service.
// 2. Keep ClientReader as the port so visit use cases do not change.
@Injectable()
export class NullClientReader implements ClientReader {
  async findById(_id: number): Promise<ClientSnapshot | null> {
    return null;
  }
}
