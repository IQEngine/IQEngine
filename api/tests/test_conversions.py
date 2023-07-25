import pytest
from helpers.conversions import find_smallest_and_largest_next_to_each_other


@pytest.mark.asyncio
async def test_find_smallest_and_largest_next_to_each_other():
    testvalue = find_smallest_and_largest_next_to_each_other([1, 2, 3, 5, 6, 7, 9, 10, 12, 14])
    assert testvalue == [[1,3],[5,7],[9,10],[12,12],[14,14]]

@pytest.mark.asyncio
async def test_find_smallest_and_largest_next_to_each_other_when_empty():
    testvalue = find_smallest_and_largest_next_to_each_other([])
    assert testvalue == []

@pytest.mark.asyncio
async def test_find_smallest_and_largest_next_to_each_other_when_one_element():
    testvalue = find_smallest_and_largest_next_to_each_other([1])
    assert testvalue == [[1,1]]

@pytest.mark.asyncio
async def test_find_smallest_and_largest_next_to_each_other_when_multiple_elements():
    testvalue = find_smallest_and_largest_next_to_each_other([1,2,3,4,5,6,7,8,9,10])
    assert testvalue == [[1,10]]

@pytest.mark.asyncio
async def test_find_smallest_and_largest_next_to_each_other_when_multiple_elements_with_gaps():
    testvalue = find_smallest_and_largest_next_to_each_other([1,2,3,4,5,7,8,9,10])
    assert testvalue == [[1,5],[7,10]]

@pytest.mark.asyncio
async def test_find_smallest_and_largest_next_to_each_other_when_unordered_list():
    testvalue = find_smallest_and_largest_next_to_each_other([10,9,8,7,15,5,4,3,2,1])
    assert testvalue == [[1,5],[9,10],[15,15]]