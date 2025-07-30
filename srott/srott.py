#!/usr/bin/env python3
"""
SROTT - Personal Port Sniffer
Scans active and inactive ports, identifies processes, and manages them with sudo access.
"""

import socket
import subprocess
import sys
import os
import signal
import argparse
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Tuple, Optional
import psutil
import time
from tabulate import tabulate
from colorama import init, Fore, Style

# Initialize colorama for cross-platform colored output
init(autoreset=True)

class PortSniffer:
    def __init__(self, start_port: int = 1, end_port: int = 65535, timeout: float = 0.5, max_workers: int = 100):
        self.start_port = start_port
        self.end_port = end_port
        self.timeout = timeout
        self.max_workers = max_workers
        self.open_ports = {}
        self.closed_ports = []
        
    def check_port(self, port: int) -> Tuple[int, bool, Optional[Dict]]:
        """Check if a port is open and get process info if available"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(self.timeout)
        
        try:
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            
            if result == 0:
                # Port is open, try to get process info
                process_info = self.get_process_info(port)
                return (port, True, process_info)
            else:
                return (port, False, None)
        except Exception:
            return (port, False, None)
    
    def get_process_info(self, port: int) -> Optional[Dict]:
        """Get process information for a given port"""
        try:
            for conn in psutil.net_connections():
                if conn.laddr.port == port and conn.status == 'LISTEN':
                    try:
                        proc = psutil.Process(conn.pid)
                        return {
                            'pid': conn.pid,
                            'name': proc.name(),
                            'cmdline': ' '.join(proc.cmdline()),
                            'user': proc.username(),
                            'status': proc.status(),
                            'create_time': proc.create_time()
                        }
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        return {'pid': conn.pid, 'name': 'Access Denied', 'user': 'N/A'}
        except Exception:
            pass
        return None
    
    def scan_ports(self, progress_callback=None) -> Dict:
        """Scan ports in the specified range"""
        print(f"{Fore.CYAN}Scanning ports {self.start_port}-{self.end_port}...{Style.RESET_ALL}")
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {executor.submit(self.check_port, port): port 
                      for port in range(self.start_port, self.end_port + 1)}
            
            completed = 0
            total = self.end_port - self.start_port + 1
            
            for future in as_completed(futures):
                port, is_open, process_info = future.result()
                completed += 1
                
                if is_open:
                    self.open_ports[port] = process_info
                else:
                    self.closed_ports.append(port)
                
                if progress_callback:
                    progress_callback(completed, total)
                elif completed % 1000 == 0:
                    print(f"Progress: {completed}/{total} ports scanned...")
        
        return {
            'open': self.open_ports,
            'closed': self.closed_ports,
            'total_scanned': total
        }

class ProcessManager:
    @staticmethod
    def is_system_port(port: int) -> bool:
        """Check if a port is a system port (< 1024)"""
        return port < 1024
    
    @staticmethod
    def start_process(pid: int) -> Tuple[bool, str]:
        """Resume a paused process"""
        try:
            os.kill(pid, signal.SIGCONT)
            return True, f"Process {pid} resumed successfully"
        except Exception as e:
            return False, f"Failed to resume process {pid}: {str(e)}"
    
    @staticmethod
    def pause_process(pid: int) -> Tuple[bool, str]:
        """Pause a running process"""
        try:
            os.kill(pid, signal.SIGSTOP)
            return True, f"Process {pid} paused successfully"
        except Exception as e:
            return False, f"Failed to pause process {pid}: {str(e)}"
    
    @staticmethod
    def kill_process(pid: int, force: bool = False) -> Tuple[bool, str]:
        """Kill a process"""
        try:
            if force:
                os.kill(pid, signal.SIGKILL)
            else:
                os.kill(pid, signal.SIGTERM)
            return True, f"Process {pid} killed successfully"
        except Exception as e:
            return False, f"Failed to kill process {pid}: {str(e)}"

class SrottCLI:
    def __init__(self):
        self.sniffer = PortSniffer()
        self.manager = ProcessManager()
        
    def display_results(self, results: Dict):
        """Display scan results in a formatted table"""
        open_ports = results['open']
        
        if not open_ports:
            print(f"\n{Fore.YELLOW}No open ports found in the specified range.{Style.RESET_ALL}")
            return
        
        # Prepare table data
        table_data = []
        for port, info in sorted(open_ports.items()):
            if info:
                status_color = Fore.GREEN if port >= 1024 else Fore.RED
                table_data.append([
                    f"{status_color}{port}{Style.RESET_ALL}",
                    info.get('pid', 'N/A'),
                    info.get('name', 'Unknown'),
                    info.get('user', 'N/A'),
                    info.get('status', 'N/A'),
                    'System' if self.manager.is_system_port(port) else 'User'
                ])
            else:
                table_data.append([
                    f"{Fore.GREEN}{port}{Style.RESET_ALL}",
                    'Unknown',
                    'Unknown',
                    'Unknown',
                    'Unknown',
                    'User'
                ])
        
        print(f"\n{Fore.CYAN}=== Open Ports ==={Style.RESET_ALL}")
        print(tabulate(table_data, 
                      headers=['Port', 'PID', 'Process', 'User', 'Status', 'Type'],
                      tablefmt='grid'))
        
        print(f"\n{Fore.GREEN}Total open ports: {len(open_ports)}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Total closed ports: {len(results['closed'])}{Style.RESET_ALL}")
        print(f"{Fore.BLUE}Total ports scanned: {results['total_scanned']}{Style.RESET_ALL}")
    
    def interactive_mode(self, results: Dict):
        """Interactive mode for managing processes"""
        open_ports = results['open']
        
        while True:
            print(f"\n{Fore.CYAN}=== Process Management ==={Style.RESET_ALL}")
            print("Commands:")
            print("  list    - List all open ports")
            print("  start   - Resume a paused process")
            print("  pause   - Pause a running process")
            print("  kill    - Kill a process")
            print("  refresh - Rescan ports")
            print("  exit    - Exit interactive mode")
            
            command = input(f"\n{Fore.GREEN}srott> {Style.RESET_ALL}").strip().lower()
            
            if command == 'exit':
                break
            elif command == 'list':
                self.display_results(results)
            elif command == 'refresh':
                results = self.sniffer.scan_ports()
                self.display_results(results)
                open_ports = results['open']
            elif command in ['start', 'pause', 'kill']:
                try:
                    port = int(input("Enter port number: "))
                    if port not in open_ports:
                        print(f"{Fore.RED}Port {port} is not open or no process found.{Style.RESET_ALL}")
                        continue
                    
                    if self.manager.is_system_port(port):
                        print(f"{Fore.RED}Warning: Port {port} is a system port. Proceed with caution!{Style.RESET_ALL}")
                        confirm = input("Are you sure? (yes/no): ").strip().lower()
                        if confirm != 'yes':
                            continue
                    
                    process_info = open_ports[port]
                    if not process_info or 'pid' not in process_info:
                        print(f"{Fore.RED}No process information available for port {port}.{Style.RESET_ALL}")
                        continue
                    
                    pid = process_info['pid']
                    
                    if command == 'start':
                        success, msg = self.manager.start_process(pid)
                    elif command == 'pause':
                        success, msg = self.manager.pause_process(pid)
                    elif command == 'kill':
                        force = input("Force kill? (yes/no): ").strip().lower() == 'yes'
                        success, msg = self.manager.kill_process(pid, force)
                    
                    if success:
                        print(f"{Fore.GREEN}{msg}{Style.RESET_ALL}")
                    else:
                        print(f"{Fore.RED}{msg}{Style.RESET_ALL}")
                        
                except ValueError:
                    print(f"{Fore.RED}Invalid port number.{Style.RESET_ALL}")
                except Exception as e:
                    print(f"{Fore.RED}Error: {str(e)}{Style.RESET_ALL}")

def main():
    parser = argparse.ArgumentParser(
        description='SROTT - Personal Port Sniffer',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  srott                     # Scan all ports (1-65535)
  srott -p 80-8080         # Scan ports 80 to 8080
  srott -p 80,443,8080     # Scan specific ports
  srott -i                 # Interactive mode
  srott -j output.json     # Save results to JSON
        """
    )
    
    parser.add_argument('-p', '--ports', type=str, 
                       help='Port range (e.g., 80-8080) or comma-separated ports (e.g., 80,443,8080)')
    parser.add_argument('-t', '--timeout', type=float, default=0.5,
                       help='Connection timeout in seconds (default: 0.5)')
    parser.add_argument('-w', '--workers', type=int, default=100,
                       help='Number of concurrent workers (default: 100)')
    parser.add_argument('-i', '--interactive', action='store_true',
                       help='Enter interactive mode after scan')
    parser.add_argument('-j', '--json', type=str,
                       help='Save results to JSON file')
    parser.add_argument('-q', '--quick', action='store_true',
                       help='Quick scan common ports only')
    
    args = parser.parse_args()
    
    # Check if running with sufficient privileges for process management
    if os.geteuid() != 0 and args.interactive:
        print(f"{Fore.YELLOW}Warning: Running without sudo. Process management features may be limited.{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}For full functionality, run with: sudo {' '.join(sys.argv)}{Style.RESET_ALL}\n")
    
    # Parse port range
    if args.quick:
        # Common ports for quick scan
        ports = [21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995, 
                1723, 3306, 3389, 5900, 8080, 8443, 8888]
        start_port = min(ports)
        end_port = max(ports)
    elif args.ports:
        if '-' in args.ports:
            start_port, end_port = map(int, args.ports.split('-'))
        elif ',' in args.ports:
            ports = list(map(int, args.ports.split(',')))
            start_port = min(ports)
            end_port = max(ports)
        else:
            start_port = end_port = int(args.ports)
    else:
        start_port = 1
        end_port = 65535
    
    # Create scanner instance
    cli = SrottCLI()
    cli.sniffer = PortSniffer(start_port, end_port, args.timeout, args.workers)
    
    # ASCII Art Banner
    print(f"""{Fore.CYAN}
███████╗██████╗  ██████╗ ████████╗████████╗
██╔════╝██╔══██╗██╔═══██╗╚══██╔══╝╚══██╔══╝
███████╗██████╔╝██║   ██║   ██║      ██║   
╚════██║██╔══██╗██║   ██║   ██║      ██║   
███████║██║  ██║╚██████╔╝   ██║      ██║   
╚══════╝╚═╝  ╚═╝ ╚═════╝    ╚═╝      ╚═╝   
{Style.RESET_ALL}""")
    print(f"{Fore.GREEN}Personal Port Sniffer v1.0{Style.RESET_ALL}")
    print("-" * 50)
    
    # Perform scan
    start_time = time.time()
    results = cli.sniffer.scan_ports()
    end_time = time.time()
    
    print(f"\n{Fore.GREEN}Scan completed in {end_time - start_time:.2f} seconds{Style.RESET_ALL}")
    
    # Display results
    cli.display_results(results)
    
    # Save to JSON if requested
    if args.json:
        # Convert process info to JSON-serializable format
        json_results = {
            'scan_time': time.strftime('%Y-%m-%d %H:%M:%S'),
            'duration': end_time - start_time,
            'port_range': f"{start_port}-{end_port}",
            'open_ports': {}
        }
        
        for port, info in results['open'].items():
            if info:
                json_results['open_ports'][port] = {
                    'pid': info.get('pid'),
                    'name': info.get('name'),
                    'user': info.get('user'),
                    'status': info.get('status'),
                    'cmdline': info.get('cmdline', '')
                }
        
        with open(args.json, 'w') as f:
            json.dump(json_results, f, indent=2)
        print(f"\n{Fore.GREEN}Results saved to {args.json}{Style.RESET_ALL}")
    
    # Enter interactive mode if requested
    if args.interactive:
        cli.interactive_mode(results)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Scan interrupted by user.{Style.RESET_ALL}")
        sys.exit(0)
    except Exception as e:
        print(f"{Fore.RED}Error: {str(e)}{Style.RESET_ALL}")
        sys.exit(1)