def find_smallest_and_largest_next_to_each_other(lst):
    result = []
    i = 0
    while i < len(lst) - 1:
        if lst[i + 1] - lst[i] == 1:
            start = lst[i]
            while i < len(lst) - 1 and lst[i + 1] - lst[i] == 1:
                i += 1
            end = lst[i]
            result.append([start, end])
        else:
            result.append([lst[i], lst[i]])
        i += 1

    if i == len(lst) - 1:
        result.append([lst[i], lst[i]])

    return result