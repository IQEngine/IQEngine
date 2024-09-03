import ctypes
import dataclasses
import json
import logging
import os
import struct
from datetime import datetime
from io import BytesIO
from pprint import pprint
from typing import Optional, Tuple, Union, ClassVar, Optional

import matplotlib.pyplot as plt
import numpy as np
import scipy.signal
from astropy.time import Time
from sigmf import SigMFFile

# For info about the packet format see https://www.mathworks.com/help/comm/ug/vita49-file-reader.html or the VITA specs themselves

# Example usage:
"""
import vita49
vita49.convert_input('yourfile.vita49', 'yourfile_out') # dont include the .sigmf extension in 2nd arg, it will get added
"""

global debug

debug = False

# Length of context fields:
CONTEXT_FIELD_ENABLE = 1
CONTEXT_FIELD_RESERVED = 1
CONTEXT_FIELD_32 = 32
CONTEXT_FIELD_64 = 64
CONTEXT_FIELD_4_32 = 4 * 32
CONTEXT_FIELD_11_32 = 11 * 32
CONTEXT_FIELD_13_32 = 13 * 32
CONTEXT_FIELD_AOR = None

##Define custom data types for context fields##
class Array11x32:
    """
    Class to define the 11*32 bit datatype
    """
    size: ClassVar[int] = 11
    element_type = ctypes.c_uint32
    
    def __init__(self, data=None):
        if data is None:
            self.data = [self.element_type(0) for _ in range(self.size)]
        elif len(data) != self.size:
            raise ValueError(f"Array must have {self.size} elements")
        else:
            if all(isinstance(item, self.element_type) for item in data):
                self.data = data
            else:
                raise TypeError(f"All Elements must be of type {self.element_type}")
    def is_correct_type(self):
        return len(self.data) == self.size and all(isinstance(item, self.element_type) for item in self.data)
      
class Array13x32:
    """
    Class to define the 13*32 bit datatype
    """
    size: ClassVar[int] = 13
    element_type = ctypes.c_uint32
    
    def __init__(self, data=None):
        if data is None:
            self.data = [self.element_type(0) for _ in range(self.size)]
        elif len(data) != self.size:
            raise ValueError(f"Array must have {self.size} elements")
        else:
            if all(isinstance(item, self.element_type) for item in data):
                self.data = data
            else:
                raise TypeError(f"All Elements must be of type {self.element_type}")
    def is_correct_type(self):
        return len(self.data) == self.size and all(isinstance(item, self.element_type) for item in self.data)   

class Array4x32:
    """
    Class to define the 4*32 bit datatype
    """
    size: ClassVar[int] = 4
    element_type = ctypes.c_uint32
    
    def __init__(self, data=None):
        if data is None:
            self.data = [self.element_type(0) for _ in range(self.size)]
        elif len(data) != self.size:
            raise ValueError(f"Array must have {self.size} elements")
        else:
            if all(isinstance(item, self.element_type) for item in data):
                self.data = data
            else:
                raise TypeError(f"All Elements must be of type {self.element_type}")
    def is_correct_type(self):
        return len(self.data) == self.size and all(isinstance(item, self.element_type) for item in self.data)   

class GPS_ASCII:
    """
    Class to define GPS ASCII datatype (special datatype with 2nd word containing the number of words)
    -> Size not defined in this class, instead class is used to query the datatypes later
    """
    def __init__(self, size:int, element_type):
        self.size = size
        self.element_type = element_type
        self.data = [self.element_type(0) for _ in range(self.size)]
        
    def is_correct_type(self):
        return len(self.data) == self.size and all(isinstance(item, self.element_type) for item in self.data) 

class ContextAssociationLists:
    """
    Class to define the Context Association Lists datatype (special datatype with 2nd word containing the number of words)
    -> Size not defined in this class, instead class is used to query the datatypes later
    """
    def __init__(self, size:int, element_type):
        self.size = size
        self.element_type = element_type
        self.data = [self.element_type(0) for _ in range(self.size)]
        
    def is_correct_type(self):
        return len(self.data) == self.size and all(isinstance(item, self.element_type) for item in self.data) 


@dataclasses.dataclass
class CurrentContextPacket:
    """Stores current context packet for each data packet. Context packet object is stored in current_context dict with streamID as key and current context packet
    object as value
    """

    current_context = {}
    sample_start = {}
    #sample_start = 0


#### dataclasses Packet structure####
@dataclasses.dataclass
class Header:
    """> class for header(everything until including fract. timestamp (same for context and data))

    # *Attributes - First Word:*

    - packet_type: (4bit) 0 -> da ta packet without StreamID, 1 -> data packet with StreamID, 4 -> context packet

    - C: (1bit) 1 -> Class fields (Second Word) present, 0 -> Class fields (Second Word) not present

    - indicators(3bit):

        > indicators[0]: 0 -> no Trailer, 1 -> Trailer included

        > indicators[1]: 0 -> IS a Vita49.0 packet, 1 -> is NOT a Vita49.0 packet

        > indicators[2]: 0 -> Signal Time Data, 1 -> Signal Spectrum Data

    - TSI: (2bit):

        > 00 -> no int timestamp included

        > 01 -> UTC

        > 10 -> GPS time

        > 11 -> other

    - TSF: (2bit):

        > 00 -> no fract timestamp included

        > 01 -> sample count timestamp

        > 10 -> Real time (picoseconds) timestamp

        > 11 -> Free running count timestamp

    - packet_count: (4bit) packet count from 0-15, when 15(1111) reached, packet_count reset to 0(0000)

    - packet_size: (16bit) packet size (in 32bit words) including ALL fields (also header, etc)

    # *Attributes - Second Word:*

    > (mandatory for context packets, optional for data packets)

    - stream_identifier: (32bit) for multiplexing of multiple channels. Context packets and data packets with same stream ID belong to each other

    # *Attributes - Third Word(optional)*

    - pad_bit_count: (5bit) difference between the nearest multiple of 32 and the actual number of payload bits to pack

    - reserved: (3bit) reserved bits in vita standard are always 0

    - oui: (24bit) Organizationally unique identifier

    - information_class_code: (16bit) -

    - packet_class_code: (16bit) -

    # *Attributes - Fourth Word (optional):*

    - integer_seconds_timestamp: (32bit) as described by TSI indicator

    # *Attributes - Fifth Word (optional):*

    - fractional_seconds_timestamp: (64bit) as described by TSF indicator
    """

    packet_type: int = 0
    C: int = 0
    indicators: str = ""
    TSI: int = 0
    TSF: int = 0
    packet_count: int = 0
    packet_size: int = 0

    stream_identifier: ctypes.c_uint32 = 0

    pad_bit_count: int = 0
    reserved: int = 0
    oui: int = 0
    information_class_code: int = 0
    packet_class_code: int = 0

    integer_seconds_timestamp: ctypes.c_uint32 = 0

    fractional_seconds_timestamp: ctypes.c_uint64 = 0


@dataclasses.dataclass
class Context_Cif0:
    """> class for only context data (starting after frac timestamp). Currently only Cif0 is supported!

    # **Attributes**:

    - *cif_indicator_field:*

    32 bit number of indicator flags. 1 means that context field is included in payload after cif indicator fields.
    each context field is represented by one flag in the cif0_indicator field. The order of fields matches the order
    used below.

    - *context_field_change_indicator:*

    1 if context data compared to last context packet has changed, 0 if not. Sending context packets even though
    no changes occured can be sensical to have a continuous stream of context data

    - *reference_point_identifier:*

    conveys the SID of a reference point. It contains the StreamID assigned to the reference point

    - *bandwidth:*

    bandwidth of the signal

    - *if_reference_frequency:*

    The spectral band described by the bandwidth is typically symmetrical around the IF reference frequency -> center frequency. If asymmetrical, IF band offset necessary

    - *rf_reference_frequency:*

    original reference frequency before down conversion

    - *rf_reference_frequency_offset:*

    *RF reference frequency + RF reference frequency offset ---Frequency Translation---> IF reference frequency*

    - *if_band_offset:*

    *Band Center = IF reference frequency + IF band offset*

    - *reference_level:*

    power of signal in dBm

    - *gain:*

    Gain of Signal in dB

    - *over_range_count:*

    - *sample_rate:*

    - *timestamp_adjustment:*

    - *timestamp_calibration_time:*

    - *temperature:*

    - *device_identifier:*

    - *state_event_indicators*

    - *signal_data_packet_payload_format*

    - *formatted_gps*

    - *formatted_ins*

    - *ecef_ephemeris*

    - *relative_ephemeris*

    - *ephemeris_ref_id*

    - *gps_ascii*

    - *context_association_lists*

    - *field_attributes_enable*

    --

    - *context_field_reserved:*

    reserved as 0

    - *context_field_enable:*

    Enables other cif indicator fields (32 bit fields after cif0 indicator field if enabled). In these fields further Context Fields can be enabled

    - *context_field_reserved2:*

    reserved as 0

    """

    cif_indicator_field = []

    context_field_change_indicator: bool = False
    reference_point_identifier: ctypes.c_uint32 = None
    bandwidth: ctypes.c_uint64 = None
    if_reference_frequency: ctypes.c_uint64 = None
    rf_reference_frequency: ctypes.c_uint64 = None
    rf_reference_frequency_offset: ctypes.c_uint64 = None
    if_band_offset: ctypes.c_uint64 = None
    reference_level: ctypes.c_uint32 = None
    gain: ctypes.c_uint32 = None
    over_range_count: ctypes.c_uint32 = None
    sample_rate: ctypes.c_uint64 = None
    timestamp_adjustment: ctypes.c_uint64 = None
    timestamp_calibration_time: ctypes.c_uint32 = None
    temperature: ctypes.c_uint32 = None
    device_identifier: ctypes.c_uint64 = None
    state_event_indicators: ctypes.c_uint32 = None
    signal_data_packet_payload_format: ctypes.c_uint64 = None
    formatted_gps: Array11x32 = dataclasses.field(default_factory=Array11x32) #11*32
    formatted_ins:  Array11x32 = dataclasses.field(default_factory=Array11x32)#11*32
    ecef_ephemeris:  Array13x32 = dataclasses.field(default_factory=Array13x32) #13*32
    relative_ephemeris:  Array11x32 = dataclasses.field(default_factory=Array11x32) #11*32
    ephemeris_ref_id: ctypes.c_uint32 = None
    gps_ascii:  GPS_ASCII = None # Not AoR still variable. Needs to be parsed separately
    context_association_lists: ContextAssociationLists = None # Not AoR still variable. Needs to be parsed separately
    field_attributes_enable: str = "0"
    context_field_reserved: str = "0"  # occurs 3 times (index 4,5,6(from specification, reverse as python index))
    context_field_enable: str = "0"  # occurs 3 times (index 1,2,3(from specification, reverse as python index))
    context_field_reserved2: str = "0"  # occurs once (index 0(from specification, reverse as python index))

    class_atr = []

    class_types = []

    included_fields = []
    
@dataclasses.dataclass
class Context_CIF1():
    """Class containing all CIF1 fields and field sizes.
    """
    
    cif1_indicator_field = []

    phase_offset: ctypes.c_uint32 = None
    polarization: ctypes.c_uint32 = None
    #poynting_vector_3D: tuple[ctypes.c_uint32, ctypes.c_uint32]  = None
    poynting_vector_3D: ctypes.c_uint32 = None
    poynting_vector_3D_structure: None = None   #AoR
    spatial_scan_type: ctypes.c_uint32 = None
    spatial_reference_type: ctypes.c_uint32 = None
    beam_width: ctypes.c_uint32 = None
    range_distance: ctypes.c_uint32 = None
    reserved_23: str = "0"
    reserved_22: str = "0"
    reserved_21: str = "0"
    eb_no_ber: ctypes.c_uint32 = None
    threshold: ctypes.c_uint32 = None
    compression_point: ctypes.c_uint32 = None
    seconds_third_intercept_points: ctypes.c_uint32 = None
    snr_noise_figure: ctypes.c_uint32 = None
    aux_frequency: ctypes.c_uint64 = None
    aux_gain: ctypes.c_uint32 = None
    aux_bandwidth: ctypes.c_uint64 = None
    reserved_13: str = "0"
    array_of_cifs: None = None   #AoR
    spectrum:  Array13x32 = dataclasses.field(default_factory=Array13x32)   # 13*32 bits
    sector_scan_step: None = None # AoR
    reserved_8: str = "0"
    index_list: None = None #AoR
    discrete_io_32: ctypes.c_uint32 = None
    discrete_io_64: ctypes.c_uint64 = None
    health_status: ctypes.c_uint32 = None
    v49_spec_compliance: ctypes.c_uint32 = None
    version_build_code: ctypes.c_uint32 = None
    buffer_size: ctypes.c_uint64 = None
    reserved_0: str = "0"
    
    context_field_reserved: str = "0" #for all three reserved fields

    class_atr = []

    class_types = []

    included_fields = []

@dataclasses.dataclass
class Context_CIF2():
    """Class containing all CIF2 fields and field sizes.
    """
    cif2_indicator_field = []

    bind: ctypes.c_uint32 = None
    cited_SID: ctypes.c_uint32 = None
    sibling_SID: ctypes.c_uint32 = None
    parent_SID: ctypes.c_uint32 = None
    child_SID: ctypes.c_uint32 = None
    cited_message_ID: ctypes.c_uint32 = None
    controllee_ID: ctypes.c_uint32 = None
    controllee_UUID: Array4x32 = dataclasses.field(default_factory=Array4x32) #4*32
    controller_ID: ctypes.c_uint32 = None
    controller_UUID: Array4x32 = dataclasses.field(default_factory=Array4x32) #4*32
    information_source: ctypes.c_uint32 = None
    track_ID: ctypes.c_uint32 = None
    country_code: ctypes.c_uint32 = None
    operator: ctypes.c_uint32 = None
    platform_class: ctypes.c_uint32 = None
    platform_instance: ctypes.c_uint32 = None
    platform_display: ctypes.c_uint32 = None
    ems_device_class: ctypes.c_uint32 = None
    ems_device_type: ctypes.c_uint32 = None
    ems_device_instance: ctypes.c_uint32 = None
    modulation_class: ctypes.c_uint32 = None
    modulation_type: ctypes.c_uint32 = None
    function_ID: ctypes.c_uint32 = None
    mode_ID: ctypes.c_uint32 = None
    event_ID: ctypes.c_uint32 = None
    function_priority_ID: ctypes.c_uint32 = None
    communication_priority_ID: ctypes.c_uint32 = None
    rf_footprint: ctypes.c_uint32 = None
    rf_footprint_range: ctypes.c_uint32 = None
    reserved_2: str = "0"
    reserved_1: str = "0"
    reserved_0: str = "0"

    class_atr = []

    class_types = []

    included_fields = []   

@dataclasses.dataclass
class Context_CIF3():
    """Class containing all CIF3 fields and field sizes.
    """
    
    cif3_indicator_field = []

    timestamp_details: ctypes.c_uint64 = None
    timestamp_skew: ctypes.c_uint64 = None
    reserved_29: str = "0"
    reserved_28: str = "0"
    rise_time: ctypes.c_uint64 = None
    fall_time: ctypes.c_uint64 = None
    offset_time: ctypes.c_uint64 = None
    pulse_width: ctypes.c_uint64 = None
    period: ctypes.c_uint64 = None
    duration: ctypes.c_uint64 = None
    dwell: ctypes.c_uint64 = None
    jitter: ctypes.c_uint64 = None
    reserved_19: ctypes.c_uint64 = None
    reserved_18: ctypes.c_uint64 = None
    #"None" as datatype in CIF3 is NOT AoR but instead either 32/64/96 bits, depending on TSI and TSF flags. None is used as AoR's dont occur
    # in CIF3 and hence no collision
    age: None = None
    shelf_life: None = None
    reserved_15: str = "0"
    reserved_14: str = "0"
    reserved_13: str = "0"
    reserved_12: str = "0"
    reserved_11: str = "0"
    reserved_10: str = "0"
    reserved_9: str = "0"
    reserved_8: str = "0"
    air_temperature: ctypes.c_uint32 = None
    sea_ground_temperature: ctypes.c_uint32 = None
    humidity: ctypes.c_uint32 = None
    barometric_pressure: ctypes.c_uint32 = None
    sea_and_swell_state: ctypes.c_uint32 = None
    tropospheric_state_ID: ctypes.c_uint32 = None
    network_ID: ctypes.c_uint32 = None
    reserved_0: str = "0"

    class_atr = []

    class_types = []

    included_fields = []  
@dataclasses.dataclass
class Context_CIF7():
    """Class containing all CIF7 fields and field sizes. Currently not implemented!
    """
    pass

@dataclasses.dataclass
class Data:
    """> class for only data and possibly trailer (starting after frac timestamp)

    # Attributes:

        iq_data: iq data as numpy array of I+jQ samples

        trailer: 4byte trailer if present
    """

    iq_data = None
    trailer: Optional[dict] = None

@dataclasses.dataclass
class Packet:
    """> Class for whole packet (one packet)

    # Attributes:

        header: header of any packet (All fields up to including fractional timestamp)

        body: Either context fields or data fields(+trailer)
    """

    header: Header = dataclasses.field(default_factory=lambda: Header())
    body: Union[Context_Cif0, Data] = None  # either context or data


#### Methods for parsing packets####
def parse(bs: bytes, current_context_packet_dict: CurrentContextPacket) -> Tuple[bool, Packet, int]:
    """function parses one packet

    :param bytes bs: bytestream from one packet

    :param  current_context_packet: CurrentContextPacket. Dictionary initialized in main with all current context information(most recent of each occured StreamID)

    :return Tuple[bool, Packet, int]: success indicator (True/False); Packet: One packet with all parsed information, index: currently parsed index in bytestream

    (index: start of next bytestream)
    """
    packet = Packet()

    current_context_packet = None
    index = 0
    # get header information(up to including fractional timestamp) for either context or data packet
    [success, packet.header, index] = parse_header(bs[index:])
    # if unparsable packet, this index is necessary as it has to be subtracted from the packet size to know how many more bits have to be skipped
    buff_ind = index
    if not success:
        raise Exception("Parsing header was unsuccessful!")
    else:
        # get body information
        if packet.header.packet_type == 4:
            # context packet
            [success, packet.body, length] = parse_context(bs[index:])
            index += length
            # test if all data has been read
            all_data_read(packet.header, index)
            # save Context packet in dict, sorted by streamID
            match_context_packet(packet, current_context_packet_dict)
            if not success:
                raise Exception("Parsing context fields was unsuccessful!")
        elif packet.header.packet_type == 0 or packet.header.packet_type == 1:
            # data packet with or without streamID
            [success, packet.body, index] = parse_data(packet.header, bs[index:], index, current_context_packet_dict)
            # return value is index not length (as in context), hence no addition of length to index necessary!
            # test if all data has been read
            all_data_read(packet.header, index)
            # current_context_packet = get_context_packet(packet.header, current_context_packet_dict)
            # print("CURRENT CONTEXT PACKET:")
            # pprint(current_context_packet)
            if not success:
                raise Exception("Parsing data fields was unsuccessful!")
        else:
            print("Packet Type %1i is currently not supported. Only packet types 0,1 and 4 are supported" % packet.header.packet_type)
            # parse first hedaer field
            # [success, hdr_first_field, index] = parse_bits32(bs[index:], True)
            # find size of unsupported packet
            # packet_size = hdr_first_field[16:32]
            # subtract buff_ind(index after header) because this part of the packet size has already been read
            packet_size = packet.header.packet_size
            # index += (int(packet_size,2)*4) - buff_ind
            index = packet_size * 4 - buff_ind
            print("assumed index of unsupported type is: ")
            print(packet_size)
            print(index)
            packet.body = 1
            # skip packet
    return [success, packet, index]


def parse_header(bs: bytes) -> Tuple[bool, Header, int]:
    """> parses header up to including fractional timestmap

    :param bytes bs: bytestream from [index:] to end

    :return Tuple[bool, Header, int]: success indicator (True/False); Header: Header with all parsed information up to including fractional

    timestamp, index: currently parsed index in bytestream (index: start of next bytestream)
    """
    header = Header()
    success = False

    # first word/32 bit (normal header):
    index = 0
    [success, value, length] = parse_bits32(bs[index:], True)
    index += length

    header.packet_type = int(value[0:4], 2)
    header.C = value[4]
    header.indicators = value[5:8]
    header.TSI = value[8:10]
    header.TSF = value[10:12]
    header.packet_count = int(value[12:16], 2)
    header.packet_size = int(value[16:32], 2)
    if not success:
        return (False, None, 0)

    # second word -> streamID (if present(required for context packet))
    if header.packet_type == 0:  # type 0-> data packet no stream ID
        header.stream_identifier = None
    elif header.packet_type == 1 or header.packet_type == 4:  # type 1-> data packet with StreamID//type4: context packet, streamID mandatory
        [success, value, length] = parse_bits32(bs[index:], True)
        header.stream_identifier = hex(int(value, 2))
        index += length

    if not success:
        return (False, None, 0)

    # third word -> ClassID
    if header.C == "0":
        # Class ID not present
        header.pad_bit_count = None
        header.reserved = None
        header.oui = None
        header.information_class_code = None
        header.packet_class_code = None
    else:
        # Class ID present
        [success, value, length] = parse_bits64(bs[index:], True)
        header.pad_bit_count = int(value[0:5], 2)
        header.reserved = value[5:8]
        # header.oui = hex(int(value[8:32],2))
        header.oui = hex(int(value[0:32], 2))
        header.information_class_code = hex(int(value[32:48], 2))
        header.packet_class_code = hex(int(value[48:64], 2))
        index += length

    if not success:
        return (False, None, 0)

    # fourth word -> int timestamp
    if header.TSI == "01" or header.TSI == "10" or header.TSI == "11":
        # later implement UTC, GPS, etc.
        [success, value, length] = parse_bits32(bs[index:], True)
        header.integer_seconds_timestamp = int(value, 2)
        index += length
    else:
        # no int timestamp resent
        header.integer_seconds_timestamp = None

    if not success:
        return (False, None, 0)

    # fith word -> fract timestmap
    if header.TSF == "01" or header.TSF == "10" or header.TSF == "11":
        [success, value, length] = parse_bits64(bs[index:], True)
        header.fractional_seconds_timestamp = int(value, 2)
        index += length
    else:
        header.fractional_seconds_timestamp = None

    if not success:
        return (False, None, 0)
    else:
        return (success, header, index)


def parse_context(bs: bytes) -> Tuple[bool, Context_Cif0, int]:
    """> parses context payload (from excluding fract timestamp to end of packet). Only Cif0 is interpreted, CIF1, CIF2 and CIF3 are parsed over. CIF7 is not implemented

    :param bytes bs: bytestream from [index:] to end

    :return Tuple[bool, Context, int]:  success indicator (True/False); Context: Context body with all parsed context information until eof,

    index: currently parsed index in bytestream (index: start of next bytestream)
    """
    context_CIF0 = Context_Cif0()
    success = False
    
    CIF1: ctypes.c_uint32 = None
    CIF1_flag = 0
    CIF2: ctypes.c_uint32 = None
    CIF2_flag = 0
    CIF3: ctypes.c_uint32 = None
    CIF3_flag = 0
    CIF7: ctypes.c_uint32 = None
    CIF7_flag = 0

    index = 0
    # parse cif0 indicator field

    context_CIF0.included_fields = []
    [success, cif0_indicator_field, length] = parse_bits32(bs[index:], True)
    index += length
    j = 0
    for i in cif0_indicator_field:
        if i == "1":
            # appends indices of included fields to list
            context_CIF0.included_fields.append(j)
        j += 1

    # write class attributes in list with correct index(index in class_attributes corresponding to according cif0_indicator_field)
    for f in dataclasses.fields(context_CIF0):
        # context.class_atr.append(f.name)
        if f.name == "context_field_reserved":
            #3bit long reserved field, reserved at index 0, for example, does not need to be checked and can just be appended
            for i in range(2):
                # 3bits in a row are reserved
                context_CIF0.class_atr.append(f.name)
                context_CIF0.class_types.append(f.type)
        if f.name == "context_field_enable":
            for i in range(2):
                # 3bits in a row are enables
                context_CIF0.class_atr.append(f.name)
                context_CIF0.class_types.append(f.type)
        context_CIF0.class_atr.append(f.name)
        context_CIF0.class_types.append(f.type)
    # check if cif0 indicator field is valid (is exactly 32 bit long)
    if len(cif0_indicator_field) == 32:
        # adjust index with +4,+8 or +12 bytes, depending on what cif enable fields are active(they are positioned after cif0 indicator field and have to be skipped)
        # It is sufficient to only read past the other cif enable fields as the cif context fields come after cif0 context fields and can just be disregarded
        for en in context_CIF0.included_fields:
            # test here, not in loop below because index has to be adjusted before the first context field is parsed!
            if en == 30 or en == 29 or en == 28 or en == 24:
                logging.warning("CIF1, CIF2, CIF3 or CIF7 fields included. Parser may fail as only CIF0 is currently implemented!")
                print("CIF1, CIF2, CIF3 or CIF7 fields included. Parser may fail as only CIF0 is currently implemented!")
                if en == 30:
                    CIF1_flag = 1
                if en == 29:
                    CIF2_flag = 1
                if en == 28:
                    CIF3_flag = 1
                if en == 24:
                    CIF7_flag = 1

        #Parse through context indicator fields. it is necessary to do this here and not in the statements above as the
        #order of occurance of the fields is inverse to the counting index!
        #E.g. If CIF0,1,2 enabled they are ordered CIF0->CIF1->CIF2 but because CIF2 enable has en == 29 and
        #CIF1 enable has en==30 the order would be CIF2->CIF1, which is wrong
        if CIF1_flag == 1:
            [success, CIF1, length] = parse_bits32(bs[index:], True)
            context_CIF1 = Context_CIF1()
            index += length
        if CIF2_flag == 1:
            [success, CIF2, length] = parse_bits32(bs[index:], True)
            context_CIF2 = Context_CIF2()
            index += length
        if CIF3_flag == 1:
            [success, CIF3, length] = parse_bits32(bs[index:], True)
            context_CIF3 = Context_CIF3()
            index += length
        if CIF7_flag == 1:
            length = 4
            # field is not parsed currently and may result in error!
            index += length
        
        # parse through 32 bit cif0 indicator fields
        for i in context_CIF0.included_fields:
            print(i)
            if i == 31 or i == 27 or i == 26 or i == 25:
                logging.warning("reserved bit was 1. Invalid Packet structure")
            elif i == 30 or i == 29 or i == 28 or i == 24:
                logging.warning("Cif enables were 1. Only Cif0 implemented currently!")
            elif i == 0:
                context_CIF0.context_field_change_indicator = True
            else:
                if context_CIF0.class_types[i] == ctypes.c_uint32:
                    [success, value, length] = parse_bits32(bs[index:], True)
                    # check if "special" field(not just decimal but with indicator flags and enables, etc.)
                    if context_CIF0.class_atr[i] == "state_event_indicators":
                        value = show_state_event_indicators(value)
                    elif context_CIF0.class_atr[i] == "temperature":
                        value = show_temperature(value)
                    elif context_CIF0.class_atr[i] == "timestamp_calibration_time":
                        value = int(value, 2)
                    else:
                        # convert value into human readable decimal
                        value = int(value, 2)
                        if value & (1<<31):
                            #negative
                            value -= (1<<32)
                        value /= 2.0**7
                    setattr(context_CIF0, context_CIF0.class_atr[i], value)
                    index += length
                elif context_CIF0.class_types[i] == ctypes.c_uint64:
                    [success, value, length] = parse_bits64(bs[index:], True)
                    # check if "special" field(not just decimal but with indicator flags and enables, etc.)
                    if context_CIF0.class_atr[i] == "device_identifier":
                        value = show_device_identifier(value)
                    elif context_CIF0.class_atr[i] == "signal_data_packet_payload_format":
                        value = show_signal_data_packet_payload_format(value)
                    elif context_CIF0.class_atr[i] == "timestamp_adjustment":
                        value = int(value, 2)
                    else:
                        # convert value into human readable decimal
                        # readable decimal (64 bit signed with radix point after 20th bit from MSB)
                        value = int(value, 2)
                        if value & (1<<63):
                            #negative
                            value -= (1<<64)
                        value /= 2.0**20
                    setattr(context_CIF0, context_CIF0.class_atr[i], value)
                    index += length
                #elif context.class_types[i] is None:
                elif context_CIF0.class_types[i] == Array11x32:
                    #if i == 20 or i == 18 or i == 17:
                    # 11*32 bit field, not parsed currently just "overread"
                    setattr(context_CIF0, context_CIF0.class_atr[i], None)
                    index += int(CONTEXT_FIELD_11_32 / 8)
                elif context_CIF0.class_types[i] == Array13x32:
                    # 13*32 bit field, not parsed currently just "overread"
                    setattr(context_CIF0, context_CIF0.class_atr[i], None)
                    index += int(CONTEXT_FIELD_13_32 / 8)
                elif context_CIF0.class_types[i] == GPS_ASCII:
                    #Length is in the second word of the field
                    Sizeoffield_bytes = bs[index+4: (index + 8)]
                    Sizeoffield = int.from_bytes(Sizeoffield_bytes, "big")
                    print("Array of Records data structure not implemented! Field skipped in packet")
                    index += Sizeoffield * 4 + 8#(2*4 = 8, -> fist two words not included in sizeoffield)
                    setattr(context_CIF0, context_CIF0.class_atr[i], None)
                elif context_CIF0.class_types[i] == ContextAssociationLists:
                    first_second_word = bs[index: (index+8)]
                    #Convert bytearry to 64bit bin array
                    first_second_word = bin(int.from_bytes(first_second_word, "big")).lstrip('0b').zfill(64)
                    source_list_size = 4*int(first_second_word[7:16],2)
                    system_list_size = 4*int(first_second_word[23:32],2)
                    vector_component_list_size = 4*int(first_second_word[32:48],2)
                    a_indicator = first_second_word[48]
                    asynchronous_channel_list_size = 4*int(first_second_word[49:64],2)
                    index = index + 8 + source_list_size + system_list_size + vector_component_list_size + asynchronous_channel_list_size
                    #check if asynchronous channel tag list is included (a_indicator == 1) -> same size as Asynchronous Channel Context association list
                    if a_indicator == "1":
                        asynchronous_channel_tag_list = asynchronous_channel_list_size
                        index += asynchronous_channel_tag_list
                    setattr(context_CIF0, context_CIF0.class_atr[i], None)
                elif context_CIF0.class_types[i] is None:
                    # array of records field, not parsed currently just "overread". -> parse only packet size to then skip this size in field
                    # Adjust size, only information that needs to be parsed from AOR
                    # SizeofArray if first word (32bit) from structure. SizeofArray describes size of
                    # AOR including header(and SizeofArray field itself)
                    SizeofArray_bytes = bs[index: (index + 4)]
                    SizeofArray = int.from_bytes(SizeofArray_bytes, "big")
                    print("Array of Records data structure not implemented! Field skipped in packet")
                    index += SizeofArray * 4
                    setattr(context_CIF0, context_CIF0.class_atr[i], None)
                if not success:
                    return (False, None, 0)

    else:
        return (False, 0, 0)
    
    #Parse other Cif fields
    if CIF1_flag == 1:
        #parse CIF1
        [success, value, index] = parse_CIF1(context_CIF1=context_CIF1, CIF1=CIF1, bs=bs, index=index)
    if CIF2_flag == 1:
        #parse CIF2
        [success, value, index] = parse_CIF2(context_CIF2=context_CIF2, CIF2=CIF2, bs=bs, index=index)
    if CIF3_flag == 1:
        #parse CIF3
        [success, value, index] = parse_CIF3(context_CIF3=context_CIF3, CIF3=CIF3, bs=bs, index=index)
    if CIF7_flag == 1:
        #parse CIF7 -> not implemented
        pass

    return (success, context_CIF0, index)


def parse_CIF1(context_CIF1: Context_CIF1, CIF1: int, bs: bytes, index: int) -> Tuple[bool, None, int]:
    """parses the CIF1 context fields if included in a VITA49 context packet

    :param Context_CIF1 context_CIF1: Class containing all CIF1 field sizes
    :param int CIF1: CIF1 -> 32bit indicator field indicating which context fields in CIF1 are included
    :param bytes bs: input bytestream
    :param int index: current index in packet
    :return Tuple[bool, None, int]: success indicator (True/False); index: currently parsed index in bytestream (index: start of next bytestream)
    """
    context_CIF1.included_fields = []
    success = True
    j = 0
    for i in CIF1:
        if i == "1":
            # appends indices of included fields to list
            context_CIF1.included_fields.append(j)
        j += 1
    # write class attributes in list with correct index(index in class_attributes corresponding to according cif0_indicator_field)
    for f in dataclasses.fields(context_CIF1):
        context_CIF1.class_atr.append(f.name)
        context_CIF1.class_types.append(f.type)
        
    if len(CIF1) == 32:
        for i in context_CIF1.included_fields:
            if i == 31 or i == 23 or i == 19 or i == 10 or i == 9 or i == 8:
                logging.warning("reserved bit was 1. Invalid Packet structure")
            if context_CIF1.class_types[i] == ctypes.c_uint32:
                [success, value, length] = parse_bits32(bs[index:], True)
                # convert value into human readable decimal
                value = int(value, 2)
                if value & (1<<31):
                    #negative
                    value -= (1<<32)
                value /= 2.0**7
                setattr(context_CIF1, context_CIF1.class_atr[i], value)
                index += length
            elif context_CIF1.class_types[i] == ctypes.c_uint64:
                [success, value, length] = parse_bits64(bs[index:], True)
                # convert value into human readable decimal
                # readable decimal (64 bit signed with radix point after 20th bit from MSB)
                value = int(value, 2)
                if value & (1<<63):
                    #negative
                    value -= (1<<64)
                value /= 2.0**20
                setattr(context_CIF1, context_CIF1.class_atr[i], value)
                index += length
            elif context_CIF1.class_types[i] == Array11x32:
                #if i == 20 or i == 18 or i == 17:
                # 11*32 bit field, not parsed currently just "overread"
                setattr(context_CIF1, context_CIF1.class_atr[i], None)
                index += int(CONTEXT_FIELD_11_32 / 8)
            elif context_CIF1.class_types[i] == Array13x32:
                # 13*32 bit field, not parsed currently just "overread"
                setattr(context_CIF1, context_CIF1.class_atr[i], None)
                index += int(CONTEXT_FIELD_13_32 / 8)
            elif context_CIF1.class_types[i] is None:
                # array of records field, not parsed currently just "overread". -> parse only packet size to then skip this size in field
                # Adjust size, only information that needs to be parsed from AOR
                # SizeofArray if first word (32bit) from structure. SizeofArray describes size of
                # AOR including header(and SizeofArray field itself)
                SizeofArray_bytes = bs[index: (index + 4)]
                SizeofArray = int.from_bytes(SizeofArray_bytes, "big")
                print("Array of Records data structure not implemented! Field skipped in packet")
                index += SizeofArray * 4
                setattr(context_CIF1, context_CIF1.class_atr[i], None)
            if not success:
                return (False, None, 0)
    else:
        return (False, None, 0) 
    return (True, None, index)


def parse_CIF2(context_CIF2: Context_CIF2, CIF2: int, bs: bytes, index: int) -> Tuple[bool, None, int]:
    """parses the CIF2 context fields if included in a VITA49 context packet

    :param Context_CIF2 context_CIF2: Class containing all CIF2 field sizes
    :param int CIF2: CIF2 -> 32bit indicator field indicating which context fields in CIF2 are included
    :param bytes bs: input bytestream
    :param int index: current index in packet
    :return Tuple[bool, None, int]: success indicator (True/False); index: currently parsed index in bytestream (index: start of next bytestream)
    """
    context_CIF2.included_fields = []
    success = True
    j = 0
    for i in CIF2:
        if i == "1":
            # appends indices of included fields to list
            context_CIF2.included_fields.append(j)
        j += 1
    # write class attributes in list with correct index(index in class_attributes corresponding to according cif0_indicator_field)
    for f in dataclasses.fields(context_CIF2):
        context_CIF2.class_atr.append(f.name)
        context_CIF2.class_types.append(f.type)
        
    if len(CIF2) == 32:
        for i in context_CIF2.included_fields:
            if i == 31 or i == 30 or i == 29:
                logging.warning("reserved bit was 1. Invalid Packet structure")
            if context_CIF2.class_types[i] == ctypes.c_uint32:
                [success, value, length] = parse_bits32(bs[index:], True)
                # convert value into human readable decimal
                value = int(value, 2)
                if value & (1<<31):
                    #negative
                    value -= (1<<32)
                value /= 2.0**7
                setattr(context_CIF2, context_CIF2.class_atr[i], value)
                index += length
            elif context_CIF2.class_types[i] == Array4x32:
                #if i == 20 or i == 18 or i == 17:
                # 11*32 bit field, not parsed currently just "overread"
                setattr(context_CIF2, context_CIF2.class_atr[i], None)
                index += int(CONTEXT_FIELD_4_32 / 8)
            if not success:
                return (False, None, 0)
    else:
        return (False, None, 0) 
    return (True, None, index)


def parse_CIF3(context_CIF3: Context_CIF3, CIF3: int, bs: bytes, index: int) -> Tuple[bool, None, int]:
    """parses the CIF3 context fields if included in a VITA49 context packet

    :param Context_CIF3 context_CIF3: Class containing all CIF3 field sizes
    :param int CIF3: CIF3 -> 32bit indicator field indicating which context fields in CIF3 are included
    :param bytes bs: input bytestream
    :param int index: current index in packet
    :return Tuple[bool, None, int]: success indicator (True/False); index: currently parsed index in bytestream (index: start of next bytestream)
    """
    context_CIF3.included_fields = []
    success = True
    j = 0
    for i in CIF3:
        if i == "1":
            # appends indices of included fields to list
            context_CIF3.included_fields.append(j)
        j += 1
    # write class attributes in list with correct index(index in class_attributes corresponding to according cif0_indicator_field)
    for f in dataclasses.fields(context_CIF3):
        context_CIF3.class_atr.append(f.name)
        context_CIF3.class_types.append(f.type)
        
    if len(CIF3) == 32:
        for i in context_CIF3.included_fields:
            if i == 2 or i == 3 or i == 12 or i == 13 or i == 31:
                logging.warning("reserved bit was 1. Invalid Packet structure")
            reserved_fields_16_to_23 = [16, 17, 18, 19, 20, 21, 22, 23]
            if i in reserved_fields_16_to_23:
                logging.warning("reserved bit was 1. Invalid Packet structure")
            if context_CIF3.class_types[i] == ctypes.c_uint32:
                [success, value, length] = parse_bits32(bs[index:], True)
                # convert value into human readable decimal
                value = int(value, 2)
                if value & (1<<31):
                    #negative
                    value -= (1<<32)
                value /= 2.0**7
                setattr(context_CIF3, context_CIF3.class_atr[i], value)
                index += length
            elif context_CIF3.class_types[i] == ctypes.c_uint64:
                [success, value, length] = parse_bits64(bs[index:], True)
                # convert value into human readable decimal
                # readable decimal (64 bit signed with radix point after 20th bit from MSB)
                value = int(value, 2)
                if value & (1<<63):
                    #negative
                    value -= (1<<64)
                value /= 2.0**20
                setattr(context_CIF3, context_CIF3.class_atr[i], value)
                index += length
            elif context_CIF3.class_types[i] is None:
                #Currently hardcoded to 12 bytes
                #datatype None is for fields 17(index:14) and 16(index:15) (age and shelf life)
                #if Packet.header.integer_seconds_timestamp is not None:
                #    index += 4
                #if Packet.header.fractional_seconds_timestamp is not None:
                #    index += 8
                index += 12
            if not success:
                return (False, None, 0)
    else:
        return (False, None, 0) 
    return (True, None, index)


def parse_data(header: Header, bs: bytes, index: int, current_context_packet_dict: CurrentContextPacket) -> Tuple[bool, Data, int]:
    """> parses data payload (from excluding fract timestamp to end of packet)

    :param bytes bs: bytestream from [index:] to end

    :param int index: current index in bs

    :return Tuple[bool, Data, int]: success indicator (True/False); Data: Data body with all parsed data information(Iq data, possibly trailer) until eof,

    index: currently parsed index in bytestream (index: start of next bytestream)
    """
    data = Data()
    # get current fitting context packet
    current_context_packet = get_context_packet(header, current_context_packet_dict)
    # parses payload+trailer(if present) of data packet
    success = False
    # Check if Trailer present
    if header.indicators[0] == "0":
        # Trailer not present
        trailer = None
        length = header.packet_size * 4 - index
        [success, value, length] = parse_to_index(bs, length)  # bs is already from index: because called in parse with correct index
        iqdata = value
        index += length
    else:
        # Trailer present
        length = header.packet_size * 4 - index - 4  # remove last 4 bytes for trailer
        # Parse payload up to trailer
        [success, value, length] = parse_to_index(bs, length)  # bs is already from index: because called in parse with correct index
        iqdata = value
        # Parse trailer (1 word)
        index += length
        [success, value, length] = parse_bits32(bs[-4:], True)
        index += length
        trailer = value
    if not success:
        return (False, None, 0)

    # show indicator fields in trailer
    trailer_dict = show_trailer_fields(trailer)

    # Plot data
    if current_context_packet is not None:
        plot_data(current_context_packet, header, data, iqdata)

    data.trailer = trailer_dict

    return (success, data, index)


def parse_bits32(bs: Union[bytes, BytesIO], basic: bool) -> Tuple[bool, bytes, int]:
    """> parses any 32bit field from bytestream bs

    :param Union[bytes,BytesIO] bs: bytestream from [index:] to end

    :param basic bool: True -> normal field; False -> radix point and sign

    :return Tuple[bool, bytes, int]: success indicator (True/False); value: value as 32 bit binary of read field,

    length: length of parsed field (here: 32bit -> 4byte) -> next field starts at index+length
    """
    success = False
    if bs is None:
        # check if bs is empty
        print("packet received, but data empty.")
        return
    if type(bs) is bytes:
        stream = BytesIO(bs)
    else:
        stream = bs
    if len(bs) >= 4:
        # check if byte stream is long enough (>=4bytes -> >=32bits)
        idbuf = stream.read1(4)
        if basic is True:
            (value,) = struct.unpack(">I", idbuf)
            # return value as 32bit binary
            value = bin(value)[2:].zfill(32)
        elif basic is False:
            (value,) = struct.unpack(">i", idbuf)
            # remove "b"
            value = bin(value)
            value = value.replace("-", "")
            value = value.replace("b", "").zfill(32)
        # stream.seek(4) #backup to 4
        success = True
    else:
        success = False

    return (success, value, 4)


def parse_bits64(bs: Union[bytes, BytesIO], basic: bool) -> Tuple[bool, bytes, int]:
    """> parses any 64bit field from bytestream bs

    :param basic bool: True -> normal field; False -> radix point and sign

    :param Union[bytes,BytesIO] bs: bytestream from [index:] to end

    :return Tuple[bool, bytes, int]: success indicator (True/False); value: value as 64 bit binary of read field,

    length: length of parsed field (here: 64bit -> 8byte) -> next field starts at index+length
    """
    success = False
    if bs is None:
        # check if bs is empty
        print("packet received, but data empty.")
        return
    if type(bs) is bytes:
        stream = BytesIO(bs)
    else:
        stream = bs
    if len(bs) >= 8:
        # check if byte stream is long enough (>=8bytes -> >=64bits)
        idbuf = stream.read1(8)
        if basic is True:
            (value,) = struct.unpack(">Q", idbuf)
            value = bin(value)[2:].zfill(64)
        elif basic is False:
            (value,) = struct.unpack(">q", idbuf)
            # remove "b"
            value = bin(value)
            value = value.replace("-", "")
            value = value.replace("b", "").zfill(64)
        # stream.seek(8) #backup to 4 to re-include stream id in data for decoding below
        success = True
    else:
        success = False
        # return (success, "", 0)
    # return value as 64bit binary
    return (success, value, 8)


def parse_to_index(bs: Union[bytes, BytesIO], length: int) -> Tuple[bool, bytes, int]:
    """> parses any field from bytestream bs from 0

    (not necessarily whole bs, e.g. not if bs given is bs[index:] in other function) to length of field(length of packet)

    :param Union[bytes,BytesIO] bs: bytestream from [index:] to end

    :param int length: _description_: length -> data parsed up to :length

    :return Tuple[bool, bytes, int]: success indicator (True/False); value: value as bit binary of read field (from given bs start to length),

    length: length of parsed field -> next field starts at index+length
    """
    success = False
    if bs is None:
        # check if bs is empty
        print("packet received, but data empty.")
        return
    if type(bs) is bytes:
        stream = BytesIO(bs)
    else:
        stream = bs
    if len(bs) >= length:
        # check if byte stream is long enough
        idbuf = stream.read1((length))
        # bs given is from index ->index position preceived as 0(because e.g. parse_data called with bs[index:] -> in parse_data bs stats with index:)
        value = idbuf[:length]
        stream.seek(0, 0)  # backup to beginning of bs
        success = True
    else:
        success = False
    # return value as raw byte stream
    return (success, value, (length))


##### Functions to read out more information from certain fields(e.g. indicator fields)#####
def show_trailer_fields(bs: bytes) -> dict:
    """> The trailer field is exactly 1 word long. It can contain indicator fields and enables which are defined below

    :param bytes bs: bytestream of trailer, has to be trailer field and exactly 32 bit long

    :return dict: return trailer field as dictionary with key(Indicators)-value(enables) pairs

    trailer fields are structured as follows:

    en;          name;                          pos.bit

    31          calibrated time indicator     19

    30          valid data indicator          18

    29          Reference Lock indicator      17

    28          AGC/MGC indicator             16    -> AGC: Automatic Gain Control; MGC: Manual Gain Control

    27          Detected signal indicator     15

    26          Spectral Inversion Indicator  14

    25          Over range indicator          13

    24          Sample loss indicator         12

    23          Sample Frame Indicator        11

    22          User Defined                  10

    21          User Defined                  9

    20          User Defined                  8

    --------------------------------------------
    7: E -> 1 Associated Contex Packet Count shall be provided; 0 -> Associated Contex Packet Count shall not be provided

    6..0: Associated Context Packet Count
    """
    if bs is not None:
        # trailer is included
        if len(bs) < 32:
            # check if trailer is 4 bytes long
            pass
            # exception
        else:
            # index 0 is bit 31
            trailer = bs
            indicator_values = [False, False, False, False, False, False, False, False, False, False, False, False, False]
            j = 0
            for i in trailer[0:12]:
                if i == "1":
                    if trailer[j + 12] == "1":
                        indicator_values[j] = True
                    else:
                        indicator_values[j] = False
                else:
                    indicator_values[j] = "Field not specified"
                j += 1

            # write as dictionary,
            trailer_dict = {
                "raw_value": trailer,
                "calibrated_time_indicator": indicator_values[0],
                "valid_data_indicator": indicator_values[1],
                "reference_lock_indicator": indicator_values[2],
                "AGC/MGC_indicator": indicator_values[3],
                "Detected_signal_indicator": indicator_values[4],
                "spectral_inversion_indicator": indicator_values[5],
                "over_range_indicator": indicator_values[6],
                "sample_loss_indicator": indicator_values[7],
                "sample_frame_indicator": indicator_values[8],
                "User_defined": indicator_values[9:12],
                "E": indicator_values[12],
                "Associated_Context_packet_count": trailer[-7:],
            }
            return trailer_dict


def show_device_identifier(bs: bytes) -> dict:
    """> Device identifier(64bit) -> structured as follows:

            word 1: first 8 bit reserved, Manufacturer OUI last 24 bit

            word 2: first 16 bit reserved, Device Code last 16 bit

    :param bytes bs:  bytestream, exactly 64 bit long

    :return dict: dictionary of fields: key -> field name; value: actual value
    """
    value = bs
    rsvd1 = value[0:8]
    oui = value[8:32]
    rsvd2 = value[32:48]
    device_code = value[48:64]
    # check if reserved fields are 0 as specified by vita49.2
    # Mistake in dataset, reserved are not 0, so warning is not because of wrong parsing of
    if rsvd1 != "00000000" or rsvd2 != "0000000000000000":
        print("WARNING: reserved bits in Device identifier field are NOT 0. They are reserved as 0 by Vita49.2 specification")

    # write as dictionary
    dev_id = {"raw_value": hex(int(value, 2)), "rsvd1 (should be 0's)": rsvd1, "rsvd2 (should be 0's)": rsvd2, "oui": oui, "device_code": device_code}
    return dev_id


def show_temperature(bs: bytes) -> float:
    """> normal field except reserved bits at front, reserved bits removed, temperature field from bit 16-32 evaluated like normal 32 bit field

    :param bytes bs:  bytestream of temperature field and exactly 32 bit long

    :return float: temperature value
    """
    # temperature
    value = bs
    rsvd = value[0:16]
    temperature = int(value[16:32], 2)
    temperature /= 2.0**7

    # check if reserved fields are 0 as specified by vita49.2
    if rsvd != "0000000000000000":
        print("WARNING: reserved bits in Device identifier field are NOT 0. They are reserved as 0 by Vita49.2 specification")

    return temperature


def show_state_event_indicators(bs: bytes) -> dict:
    """> State/Event Indicators are structured as follows:

    en;          name;                          pos.bit

    31          calibrated time indicator     19

    30          valid data indicator          18

    29          Reference Lock indicator      17

    28          AGC/MGC indicator             16

    27          Detected signal indicator     15

    26          Spectral Inversion Indicator  14

    25          Over range indicator          13

    24          Sample loss indicator         12

    23->20res.                                11->8

    7->0 user

    :param bytes bs: bytestream of state and event indicator field and exactly 32 bit long

    :return dict: return state and event indicator field as dictionary with key(Indicators)-value(enables) pairs
    """

    # index 0 is bit 31
    value = bs

    enable_values = [False, False, False, False, False, False, False, False]
    indicator_values = [False, False, False, False, False, False, False, False]
    j = 0
    for i in value[0:8]:
        if i == "1":
            enable_values[j] = True
            if value[j + 12] == "1":
                indicator_values[j] = True
            else:
                indicator_values[j] = False
        else:
            indicator_values[j] = "Field not specified"
        j += 1
    # write as dictionary,
    # overwrite value written into self.cif0_field_values before
    # at points where enable_values = True: find fitting indicator_values(+12)
    #   if true give true, if false give false, all other fields as "Not specified"
    val = {
        "raw_value": hex(int(value, 2)),
        "calibrated_time_indicator": indicator_values[0],
        "valid_data_indicator": indicator_values[1],
        "reference_lock_indicator": indicator_values[2],
        "AGC/MGC_indicator": indicator_values[3],
        "Detected_signal_indicator": indicator_values[4],
        "spectral_inversion_indicator": indicator_values[5],
        "over_range_indicator": indicator_values[6],
        "sample_loss_indicator": indicator_values[7],
    }

    return val


def show_signal_data_packet_payload_format(bs: bytes) -> dict:
    """> Signal Data Packet Payload Format

    First word

    Bit pos------------#name--------------------------------#field width[bits]

    31-----------------packing_method-----------------------#1

    30-29--------------real_complex_type--------------------#2

    28-24--------------data_item_format---------------------#5

    23-----------------sample_component_repeat_indicator----#1

    22-20--------------event_tag_size-----------------------#3

    19-16--------------channel_tag_size---------------------#4

    15-12--------------data_item_fraction_size--------------#4

    11-6---------------item_packaging_field_size------------#6

    5-0----------------data_item_size-----------------------#6

    Second word

    31-16--------------repeat_count-------------------------#16

    15-0---------------vector_size--------------------------#16

    see more under vita49.2 spec 9.13.3


    :param bytes bs:  bytestream of signal data packed payload field and exactly 64 bit long

    :return dict: dict of signal data packet payload format
    """
    value = bs

    packing_method = value[0]
    if packing_method == "0":
        packing_method = "processing_efficient_packaging"
    elif packing_method == "1":
        packing_method = "link_efficient_packaging"

    real_complex_type = value[1:3]
    if real_complex_type == "00":
        real_complex_type = "Real"
    elif real_complex_type == "01":
        real_complex_type = "Complex_cartesian"
    elif real_complex_type == "10":
        real_complex_type = "Complex_polar"
    elif real_complex_type == "11":
        real_complex_type = "Reserved"

    if real_complex_type != "Complex_cartesian":
        print("WARNING: Data Sample Format not supported. Only Complex Cartesian is supported")

    data_item_format = value[3:8]
    # data_item_size = value [26:32]
    # packing_field_size = value[20:26]

    if data_item_format == "00000":
        data_item_format = "Signed_Fixed_Point"
    #    if data_item_size == "001111":
    #        #rule 9.13.3-13: The Data Item size shall contain an unsignend number that is one less than the actual Data item size in the paired data packet stream
    #        data_item_size = 16
    #        packing_field_size = 16
    #    else:
    #        data_item_size = 32
    elif data_item_format == "10000":
        data_item_format = "Unsigned_Fixed_Point"
    elif data_item_format == "00111":
        data_item_format = "Signed_Fixed_point_Non_Normalized"
    elif data_item_format == "01110":
        data_item_format = "Single_Precision_Floating_Point"
        # data_item_size = 32
        # packing_field_size = 32
    else:
        data_item_format = "Other"
        # data_item_size = 16
        # packing_field_size = 16

    # rule 9.13.3-13: The Data Item size shall contain an unsignend number that is one less than the actual Data item size in the paired data packet stream
    data_item_size = int(value[26:32], 2) + 1
    # similar rule to data_item_size
    packing_field_size = int(value[20:26], 2) + 1

    sample_component_repeat_indicator = value[8]
    if sample_component_repeat_indicator == "0":
        sample_component_repeat_indicator = "no repeating used"
    else:
        sample_component_repeat_indicator = "repeating used"

    val = {
        "raw value": hex(int(value, 2)),
        # value[26:32]
        "packing_method": packing_method,
        "real_complex_type": real_complex_type,
        "data_item_format": data_item_format,
        "sample_component_repeat_indicator": sample_component_repeat_indicator,
        "event_tag_size": value[9:12],
        "channel_tag_size": value[12:16],
        "data_item_fraction_size": value[16:20],
        "item_packaging_field_size": packing_field_size,
        "data_item_size": data_item_size,
        "repeat_count": value[32:49],
        "vector_size": value[49:65],
    }

    return val


#### Plot IQ data, depending on context information (also save, do not comment out this function. Only comment out the plot() command if no plotting desired)####
def plot_data(current_context_packet: CurrentContextPacket, header: Header, data: Data, iqdata: bytes):
    """Function to interpret the data type and save iq data to packet.body accordingly. If Debug option is enabled, the IQ data, the power density spectrum
    and the spectogram are plotted.

    :param CurrentContextPacket current_context_packet: matching context packet (StreamID) for data packet to pull data type information

    :param Header header: packet header

    :param Data data: packet data

    :param bytes iqdata: IQ data inside data packet

    """

    data_type = ">i2"
    # extract payload information from current context packet
    # take payload information from context packet if trailer not used
    if current_context_packet is not None:
        if current_context_packet.body.signal_data_packet_payload_format is not None:
            if current_context_packet.body.signal_data_packet_payload_format["data_item_format"] == "Unsigned_Fixed_Point":
                data_type = np.int16  # !!!not really, but other is not supported
            elif current_context_packet.body.signal_data_packet_payload_format["data_item_format"] == "Signed_Fixed_Point":
                if current_context_packet.body.signal_data_packet_payload_format["data_item_size"] == 32:
                    data_type = ">i4"
                elif current_context_packet.body.signal_data_packet_payload_format["data_item_size"] == 16:
                    data_type = ">i2"
            elif current_context_packet.body.signal_data_packet_payload_format["data_item_format"] == "Single_Precision_Floating_Point":
                data_type = np.float32
                print("Warning: data payload Format not supported")
                logging.warning("Warning: data payload Format not supported")
            elif current_context_packet.body.signal_data_packet_payload_format["data_item_format"] == "Single_Fixed_Point_Non_Normalized":
                data_type = ">i2"
                print("Warning: data payloa Format not supported")
                logging.warning("Warning: data payload Format not supported")
            else:
                data_type = np.float32
                print("Warning: data payload Format not supported")
                logging.warning("Warning: data payload Format not supported")
        else:
            if header.indicators[0] == "1":
                print(
                    "Trailer information not yet implemented. See if should be implemented in the future or if data packets without context packet shall be eliminated"
                )
                # Trailer present
                # maybe implement later
                data_type = ">i2"
    else:
        # 2byte(16bit), big endian
        data_type = ">i2"
    #data_type = np.int16
    # samples =  np.frombuffer(iqdata, dtype=data_type)
    raw_data = np.frombuffer(iqdata, dtype=data_type)
    # samples = samples[::2] + 1j*samples[1::2]
    samples = raw_data[0::2] + 1j * raw_data[1::2]

    samples = samples / 32767.0
    data.iq_data = samples
    Fs = current_context_packet.body.sample_rate

    if debug == True:
        plt.plot(samples.real, ".-")
        plt.plot(samples.imag, ".-")
        plt.legend(["I", "Q"])
        plt.show()
        # print(samples)

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
        n = len(data.iq_data)

        [frequencies, psd_db_hz] = calc_power_density_spectrum(Fs=Fs, n=n, iqarray=data.iq_data)

        # ax1.figure()
        ax1.plot(frequencies, psd_db_hz)
        ax1.set_title("Power Density spectrum")
        ax1.set_xlabel("Frequency [Hz]")
        ax1.set_ylabel("Power Density [dB/Hz]")
        ax1.grid()

        # ax2.specgram(data.iq_data)
        Pxx, freqs, bins, im = ax2.specgram(data.iq_data)
        ax2.set_title("Spectogram")
        ax2.set_xlabel("Time [s]")
        ax2.set_ylabel("Frequency [Hz]")
        fig.colorbar(im, ax=ax2).set_label("Power Density [dB/Hz]")

        plt.tight_layout()

        plt.show()


##### other helping functions#####
def all_data_read(header: Header, index: int):
    """> Check if all Data has been completely read

    :param int index: current index in packet
    """
    if index != (header.packet_size) * 4:
        logging.warning("Warning: Possibly not all Data from packet read! %1i bytes from %1i bytes read." % (index, header.packet_size * 4))
        print("Warning: Possibly not all Data from packet read! %1i bytes from %1i bytes read." % (index, header.packet_size * 4))
    else:
        logging.info("packet data completely read! %1i bytes from %1i bytes read." % (index, header.packet_size * 4))
        print("packet data completely read! %1i bytes from %1i bytes read." % (index, header.packet_size * 4))


def convert_input(input_path: str, output_path: str):
    """This function converts Vita49 compliant data into SigMF.

    :param str input_path: input path of VITA49 file, use (\\) as seperator

    :param str output_path: desired output path of SigMF file, use (\\) as seperator

    """

    # NOTE- pcap mode only supports UDP packets currently
    if ".pcap" in input_path:
        from pylibpcap.pcap import rpcap  # MUCH faster than scapy/dpkt

        rpcap_iter = rpcap(input_path)
        pcap_mode = True
    else:
        f = open(input_path, "rb")
        pcap_mode = False

    current_context_packet = CurrentContextPacket()

    curr_index = 0
    num_of_packets_read = 0
    #sample_start = 0  # IQ data length is added each iteration so that sample_start for SigMF is defined

    # list of "used" stream IDs. For stream IDs appended to this list, a meta file has already been created and only a capture has to be added
    stream_ids = []
    iq_array = []
    while True:
        if pcap_mode:
            _, _, buf = next(rpcap_iter)
            data = buf[42:]
            hdr = data[0:4]
        else:
            hdr = f.read(4)  # read first 4 bytes, containing the packet size in 32 bit words of next packet
            f.seek(
                curr_index
            )  # reset reader to reinclude first 32 bit -> back to start of packet (0 for first packet, index of last packet for all following packets)

        packet_size_int = int.from_bytes(hdr[2:4], byteorder="big")  # in words, need to multiply by 4 to get number of bytes

        # read data until packet size (exactly one packet of data)
        if pcap_mode:
            if (packet_size_int * 4) != len(data):  # they should always match, if valid packets
                print("Packet size does not match actual packet size")
                exit()
        else:
            data = f.read((packet_size_int * 4))

        # check if eof is reached
        if len(data) == 0:
            break
        [success, packet, index] = parse(data, current_context_packet)
        print("-----------START OF PACKET-----------")
        print("PACKET HEADER")
        print("----------")
        pprint(packet.header)
        print("PACKET BODY")
        print("----------")
        pprint(packet.body)
        if (packet.header.packet_type == 1) and hasattr(packet.body, "iq_data") and packet.body.iq_data is not None:
            # pprint(packet.body.iq_data)
            for element in packet.body.iq_data:
                iq_array.append(element)
        print("-----------END OF PACKET-----------")
        curr_index += index
        num_of_packets_read += 1

        ### Convert packet to SigMF###
        stream_ids = convert(packet, stream_ids, current_context_packet, output_path)

        if packet.header.stream_identifier not in stream_ids and (packet.header.packet_type == 0 or packet.header.packet_type == 1):
            stream_ids.append(packet.header.stream_identifier)

        if not data:
            break
    EoF = f.read(4)  #Check if bits are left in the file
    if not EoF:
        print("All data read")
    else:
        logging.warning("Not all data read")
        
    if packet.header.stream_identifier in current_context_packet.current_context:
        #debug relies on plots, which make no sense withoug e.g. sapmple rate
        if debug == True:
            iq_array = np.array(iq_array)
            Fs = current_context_packet.current_context[packet.header.stream_identifier].body.sample_rate
            n = len(iq_array)

            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

            [frequencies, psd_db_hz] = calc_power_density_spectrum(Fs=Fs, n=n, iqarray=iq_array)

            # ax1.figure()
            ax1.plot(frequencies, psd_db_hz)
            ax1.set_title("Power Density spectrum")
            ax1.set_xlabel("Frequency [Hz]")
            ax1.set_ylabel("Power Density [dB/Hz]")
            ax1.grid()

            Pxx, freqs, bins, im = ax2.specgram(iq_array)
            ax2.set_title("Spectogram")
            ax2.set_xlabel("Time [s]")
            ax2.set_ylabel("Frequency [Hz]")
            fig.colorbar(im, ax=ax2).set_label("Power Density [dB/Hz]")

            plt.tight_layout()

            plt.show()

    print("number of packets read: ")
    print(num_of_packets_read)


def calc_power_density_spectrum(Fs: float, n: int, iqarray):
    """calculates the power density spectrum of an array of iq data.

    :param float Fs: sampling frequency

    :param int n: length of iq array

    :param _type_ iqarray: iq data in complex array

    :return _type_: frequency bins and logarithmic amplitudes

    """
    window = scipy.signal.windows.hamming(n)
    iq_array = iqarray * window
    if Fs is None:
        Fs = 1

    fft_sig = np.fft.fft(iq_array)
    fft_sig = np.fft.fftshift(fft_sig)
    frequencies = np.fft.fftfreq(n, 1 / Fs)
    frequencies = np.fft.fftshift(frequencies)

    psd = (np.abs(fft_sig) ** 2) / (Fs * n)
    psd_db_hz = 10 * np.log10(psd)

    return [frequencies, psd_db_hz]


def match_context_packet(context: object, context_dict: CurrentContextPacket):
    """function gets context packet in parse function and saves it as value in context dict with stream id as key. If
    streamID does not exist yet in dictionary, the object and according streamID are added to the dictionary. If an StreamID object pair already exists,
    the object is overwritten with the current object with that matching streamID

    :param object context: object of type Packet

    :param CurrentContextPacket context_dict: object of type currentcontextpacket (with current_context dictionary inside)

    """
    # writes current context packet correctly in dict
    # works but ugly, but otherwise circular imports. context is of type packet, but declared as object because import vita49 not possible
    streamID = context.header.stream_identifier
    # If Object with streamID already in dictionary, overwrite current object at that streamID. If not, new key value pair is added
    context_dict.current_context[str(streamID)] = context


def get_context_packet(header: object, context_dict: CurrentContextPacket) -> object:
    """_summary_

    :param object header: packet header of type Packet.header

    :param CurrentContextPacket context_dict: object of type currentcontextpacket (with current_context dictionary inside)

    :return _type_: object of type packet with current context packet
    """
    # Call this function in data packet to find the matching context packet
    stream_id = header.stream_identifier
    # return matching context packet with same streamID
    print(stream_id)
    if stream_id in context_dict.current_context.keys():
        current_packet = context_dict.current_context[str(stream_id)]
    else:
        current_packet = None
        print("No matching context packet for data packet found (may happen at start of file)")
    return current_packet


def context_to_meta(data, packet: object, stream_ids: list, current_context_packet: object, sample_start, output_path: str) -> list:
    """Function to create a sigMF metafile if it does not exist for a streamID yet. Necessary context information of vita49 data packed is written
    into captures. If metafile exists already, function adds only a capture with the given parameters(center freq, sample start, timestamp(add more later))

    Warning: If GPS time is used, it is necessary to uncomment the astropy package at the beginning of this file as well as the according command in this function
    regarding the integer GPS timestamp!

    :param _type_ data: IQ data written into sigmf data file

    :param object packet: object of type packet (will always be data packet as function is only called for data packets. Function does not need to be called
    for Context packets as the context packets are stored in current_context_packet for each data packet)

    :param list stream_ids: list of streamIDs for which a meta file has been created already. Ensures that for each streamID, only one metafile is created

    :param object current_context_packet: current context packet linked to current data packet

    :param int sample_start: start of IQ data (gets incremented each data packet by the length of the IQ data in each data packet)

    :return list: list of streamIDs for which the meta file has been written
    """

    # write per StreamID one meta core.
    # Append per packet one capture to according meta (according to streamID)

    # get current sample rate
    if current_context_packet.current_context:
        sample_rate = current_context_packet.current_context[packet.header.stream_identifier].body.sample_rate
    else:
        sample_rate = 0
        logging.warning("No sample rate given!")

    if packet.header.stream_identifier not in stream_ids:
        meta = {
            "global": {
                SigMFFile.DATATYPE_KEY: "cf32_le",  # in this case cf32_le                                #From context
                # SigMFFile.SAMPLE_RATE_KEY : 48000,                                                     #From context
                SigMFFile.AUTHOR_KEY: "test author",
                SigMFFile.DESCRIPTION_KEY: "This is a test description",  # add user prompt later? or just edit in file or leave out
                SigMFFile.VERSION_KEY: "1.0.0",
                # SigMFFile.START_OFFSET_KEY: 1,#free runing count timestamp if given
                SigMFFile.HW_KEY: "Test hardware description",
                # Could insert location here but field is currently overread in vita packet
                SigMFFile.SAMPLE_RATE_KEY: sample_rate,
            },
            "captures": [],
            "annotations": [],
        }
    else:
        with open("%s%s.sigmf-meta" % (output_path, packet.header.stream_identifier), "r") as metafile:
            meta = json.load(metafile)

    # write context information into capture fields (if they a are not None). What if they are none?
    if current_context_packet.current_context:
        # IF reference frequency (center frequency)
        if current_context_packet.current_context[packet.header.stream_identifier].body.if_reference_frequency is not None:
            center_freq = current_context_packet.current_context[packet.header.stream_identifier].body.if_reference_frequency
        else:
            if current_context_packet.current_context[packet.header.stream_identifier].body.rf_reference_frequency is not None:
                center_freq = current_context_packet.current_context[packet.header.stream_identifier].body.rf_reference_frequency
            else:
                logging.warning("no center frequency given")
                center_freq = 0

        ## Timestamps are always taken from the context packet!!##
        # Whole timestamp section is barely tested due to the lack of test data
        # Fractional timestamp
        if current_context_packet.current_context[packet.header.stream_identifier].header.fractional_seconds_timestamp is not None:
            # frac timestamp is always only a number with different interpretations based on the TSF flags
            frac_timestamp = current_context_packet.current_context[packet.header.stream_identifier].header.fractional_seconds_timestamp
        else:
            frac_timestamp = 0

        # Integer timestmap
        if current_context_packet.current_context[packet.header.stream_identifier].header.integer_seconds_timestamp is not None:
            int_timestamp = current_context_packet.current_context[packet.header.stream_identifier].header.integer_seconds_timestamp
            if current_context_packet.current_context[packet.header.stream_identifier].header.TSI == "01":
                # Again check frac timestamp. If frac timestamp = '11' or '00' there is no relation to the integer timestamp, hence it is not
                # added on top. The sample count timestamp ('01') is used as a reference point -> also not added to int timestamp
                # ->'10' real time timestamp is added to int timestamp
                # Check what type of timestamp (1 is None, 3 is not specified(just the number, no conversion necessary))
                if current_context_packet.current_context[packet.header.stream_identifier].header.TSF == "10":
                    # UTC
                    # int_timestamp = datetime.fromtimestamp(int_timestamp, tz=timezone.utc).strftime('%m/%d/%Y %r %Z')
                    # UTC time to ISO 8601 for SigMF
                    int_timestamp = datetime.fromtimestamp(int_timestamp).isoformat() + "." + str(frac_timestamp)
                else:
                    int_timestamp = datetime.fromtimestamp(int_timestamp).isoformat()
            elif current_context_packet.current_context[packet.header.stream_identifier].header.TSI == "10":
                # GPS
                # If the GPS timestamp is given either skip this block by uncommenting "pass" and commenting everything else or
                # convert the GPS timestamp by uncommenting all lines except "pass" in this elif statement
                # conversion experimental, not yet tested!

                int_timestamp_GPS = Time(int_timestamp, format="gps")
                int_timestamp = str(Time(int_timestamp_GPS, format="isot", scale="utc"))

                # Again check frac timestamp. If frac timestamp = '11' or '00' there is no relation to the integer timestamp, hence it is not
                # added on top. The sample count timestamp ('01') is used as a reference point -> also not added to int timestamp
                # ->'10' real time timestamp is added to int timestamp
                # Check what type of timestamp (1 is None, 3 is not specified(just the number, no conversion necessary))

                if current_context_packet.current_context[packet.header.stream_identifier].header.TSF == "10":
                    int_timestamp = int_timestamp + str(frac_timestamp)

        else:
            int_timestamp = 0
    else:
        # THROW ERRORS INSTEAD?
        logging.warning("no timestamp found")
        center_freq = 0
        frac_timestamp = 0
        int_timestamp = 0

    # meta.add_capture(sample_start, metadata={
    if packet.header.stream_identifier not in current_context_packet.sample_start:
        current_context_packet.sample_start[packet.header.stream_identifier] = 0
    meta["captures"].append({"core:sample_start": current_context_packet.sample_start[packet.header.stream_identifier], SigMFFile.FREQUENCY_KEY: center_freq, SigMFFile.DATETIME_KEY: int_timestamp})

    with open("%s%s.sigmf-meta" % (output_path, packet.header.stream_identifier), "w+") as metafile:
        metafile.write(json.dumps(meta, indent=4))

    return stream_ids


def data_to_sigmfdata(packet: object, stream_ids: list, output_path: str):
    """Writes IQ data from Data packet to file.

    :param object packet: datapacket

    :param list stream_ids: list of streamIDs for which a meta file has been created already. Ensures that for each streamID, only one metafile is created

    :return _type_: Tuple of iq_length (length of iq data in payload, so that sample start can be calculated for next data packet) and data (iq data itself in cf32)

    """
    body = packet.body
    data_type = np.complex64

    if not hasattr(body, "iq_data") or body.iq_data is None:
        return (np.zeros(0, dtype=data_type), 0)

    data_real = body.iq_data.real
    data_imag = body.iq_data.imag
    data = np.zeros(len(body.iq_data), dtype=data_type)
    data.real = data_real
    data.imag = data_imag
    if packet.header.stream_identifier not in stream_ids:
        # check if data file with this stream id exists even though it was not parsed yet (file from running the program before -> has to be deleted as data is just appended)
        if os.path.isfile("%s%s.sigmf-data" % (output_path, packet.header.stream_identifier)):
            # pass
            os.remove("%s%s.sigmf-data" % (output_path, packet.header.stream_identifier))
    f = open("%s%s.sigmf-data" % (output_path, packet.header.stream_identifier), "ab")
    f.write(data)
    iq_length = len(data)

    return [data, iq_length]


def convert(packet: object, stream_ids: list, current_context_packet: object, output_path: str) -> list:
    """Converts vita49 data packet to sigMF meta and data file

    :param object packet: object of type packet (either data packet or context packet)

    :param list stream_ids: list of streamIDs for which a meta file has been created already. Ensures that for each streamID, only one metafile is created

    :param object current_context_packet: current context packet linked to current data packet

    :param int sample_start: start of IQ data (gets incremented each data packet by the length of the IQ data in each data packet)

    :return list: tuple of streamids(list) and sample start(int)

    """
    if (packet.header.packet_type == 0 or packet.header.packet_type == 1) and packet.header.stream_identifier in current_context_packet.current_context:
        # only do something if packet type is data packet. Data packet has according context information already because of match and get context packet functions
        [data, iq_length] = data_to_sigmfdata(packet, stream_ids, output_path)
        stream_ids = context_to_meta(data, packet, stream_ids, current_context_packet, current_context_packet.sample_start[packet.header.stream_identifier], output_path)
        current_context_packet.sample_start[packet.header.stream_identifier] = current_context_packet.sample_start[packet.header.stream_identifier]+iq_length
    elif packet.header.packet_type == 4:
        data = 0
        stream_ids = context_to_meta(data, packet, stream_ids, current_context_packet, current_context_packet.sample_start, output_path)
        
    else:
        logging.warning("Missing context packet, data packet thrown away!")

    return stream_ids
