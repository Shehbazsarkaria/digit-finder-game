import { describe, it, expect } from 'vitest';

function filterEvens(list) {
    return list.filter(num => num % 2 === 0);
}

function filterGreaterThan(list, pivot) {
    return list.filter(num => num >= pivot);
}

describe('Game Logic Tests', () => {
    it('should correctly filter even numbers', () => {
        const input = [1, 2, 3, 4, 5];
        const result = filterEvens(input);
        expect(result).toEqual([2, 4]);
    });

    it('should correctly filter numbers greater than pivot', () => {
        const input = [10, 20, 30, 40];
        const pivot = 25;
        const result = filterGreaterThan(input, pivot);
        expect(result).toEqual([30, 40]);
    });

    it('should handle empty lists correctly', () => {
        const input = [];
        const result = filterEvens(input);
        expect(result).toEqual([]);
    });
});