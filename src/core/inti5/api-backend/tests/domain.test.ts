import { Domain } from '../index';

describe('Domain', () => {
    test('Pagination', async() => {
        const pagination = new Domain.Pagination();
        pagination.page = 2;
        pagination.itemsPerPage = 13;
        
        expect(pagination.offset).toStrictEqual(13);
    });
});
