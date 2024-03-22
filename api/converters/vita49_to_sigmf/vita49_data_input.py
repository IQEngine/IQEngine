import vita49
import Converter
from pprint import pprint

def main():
    """This programm converts Vita49 compliant data into SigMF. Change the Path in "vita49_data_input.py" to the location of your binary vita49 file.
    All three python files "vita49_data_input.py", which is the main file, reading in the bytestream, "vita49.py", which parses the vita compliant packets of the
    bytestream, and "Converter.py", which converts the read vita49 packets into SigMF, have to be in the same folder(or paths specified when importing).
    """
    filename = "C:\\Users\\SIGENCE\\Documents\\Vita49_SigMF\\testdata\\vita49dataset3_c.bin"
    f = open(filename, "rb")
    
    current_context_packet = Converter.CurrentContextPacket()
    
    curr_index = 0
    num_of_packets_read = 0
    #Iq data length is added each iteration so that sample_start for SigMF is defined
    sample_start = 0
    
    #list of "used" stream IDs. For stream IDs appended to this list, a meta file has already been created and only a capture has to be added
    stream_ids = []

    while True:
        #read first 4 bytes, containing the packet size in 32 bit words of next packet
        hdr = f.read(4)
        #packet size
        packet_size_int = int.from_bytes(hdr[2:4], byteorder ='big')
        #reset reader to reinclude first 32 bit -> back to start of packet (0 for first packet, index of last packet for all following packets)
        f.seek(curr_index)
        print(packet_size_int*4)
        #read data until packet size (exactly one packet of data)
        data = f.read((packet_size_int*4))
        #check if eof is reached
        if(len(data) == 0):
            break
        [success, packet, index] = vita49.parse(data, current_context_packet)
        print("-----------START OF PACKET-----------")
        print("PACKET HEADER")
        print("----------")
        pprint(packet.header)
        print("PACKET BODY")
        print("----------")
        pprint(packet.body)
        print("-----------END OF PACKET-----------")
        curr_index += index
        num_of_packets_read += 1

        ###Convert packet to SigMF###
        [stream_ids, sample_start] = Converter.convert(packet, stream_ids, current_context_packet, sample_start)
        
        if packet.header.stream_identifier not in stream_ids and (packet.header.packet_type == 0 or packet.header.packet_type == 1):
            stream_ids.append(packet.header.stream_identifier)
            
        if not data:
            break

    print("number of packets read: ")
    print(num_of_packets_read)
    
if __name__ == '__main__':
    main()