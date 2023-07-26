import pytest
import rf.samples as samples


@pytest.mark.asyncio
async def test_get_sample_length_from_byte_length():
    testvalue = samples.get_sample_length_from_byte_length(1)
    assert testvalue == 2