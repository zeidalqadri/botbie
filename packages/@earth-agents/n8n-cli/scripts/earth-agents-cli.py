#!/usr/bin/env python3
"""
Earth Agents N8N CLI Tool
Advanced Python-based CLI for managing Earth Agents workflows and integrations
"""

import os
import sys
import json
import click
import requests
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
import yaml
from jinja2 import Template
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EarthAgentsAPI:
    """Earth Agents API client"""
    
    def __init__(self, api_url: str, api_key: Optional[str] = None):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        
        if api_key:
            self.session.headers.update({'X-API-Key': api_key})
    
    def invoke_specialist(self, specialist: str, prompt: str, context: Optional[Dict] = None) -> Dict:
        """Invoke an Earth Agents specialist"""
        payload = {
            'specialist': specialist,
            'prompt': prompt,
            'context': context or {}
        }
        
        response = self.session.post(f"{self.api_url}/specialist/invoke", json=payload)
        response.raise_for_status()
        return response.json()
    
    def get_specialist_list(self) -> List[str]:
        """Get list of available specialists"""
        response = self.session.get(f"{self.api_url}/specialists")
        response.raise_for_status()
        return response.json().get('specialists', [])

class N8NAPI:
    """N8N API client"""
    
    def __init__(self, n8n_url: str, username: str, password: str):
        self.n8n_url = n8n_url.rstrip('/')
        self.session = requests.Session()
        self.session.auth = (username, password)
    
    def get_workflows(self) -> List[Dict]:
        """Get all workflows"""
        response = self.session.get(f"{self.n8n_url}/api/v1/workflows")
        response.raise_for_status()
        return response.json()
    
    def get_workflow(self, workflow_id: str) -> Dict:
        """Get specific workflow"""
        response = self.session.get(f"{self.n8n_url}/api/v1/workflows/{workflow_id}")
        response.raise_for_status()
        return response.json()
    
    def create_workflow(self, workflow_data: Dict) -> Dict:
        """Create new workflow"""
        response = self.session.post(f"{self.n8n_url}/api/v1/workflows", json=workflow_data)
        response.raise_for_status()
        return response.json()
    
    def activate_workflow(self, workflow_id: str) -> Dict:
        """Activate workflow"""
        response = self.session.patch(
            f"{self.n8n_url}/api/v1/workflows/{workflow_id}/activate"
        )
        response.raise_for_status()
        return response.json()
    
    def execute_workflow(self, workflow_id: str, data: Optional[Dict] = None) -> Dict:
        """Execute workflow"""
        payload = {'data': data or {}}
        response = self.session.post(
            f"{self.n8n_url}/api/v1/workflows/{workflow_id}/execute",
            json=payload
        )
        response.raise_for_status()
        return response.json()

class WorkflowGenerator:
    """Generate N8N workflows from templates"""
    
    def __init__(self, templates_dir: Path, config: Dict):
        self.templates_dir = templates_dir
        self.config = config
    
    def generate_workflow(self, template_name: str, output_file: Path, 
                         env_vars: Optional[Dict] = None) -> bool:
        """Generate workflow from template"""
        try:
            template_file = self.templates_dir / f"{template_name}.template.json"
            
            if not template_file.exists():
                logger.error(f"Template not found: {template_file}")
                return False
            
            # Load template
            with open(template_file, 'r') as f:
                template_content = f.read()
            
            # Render template with Jinja2
            template = Template(template_content)
            rendered = template.render(
                config=self.config,
                env=env_vars or {},
                timestamp=datetime.now().isoformat()
            )
            
            # Validate JSON
            workflow_data = json.loads(rendered)
            
            # Write output file
            with open(output_file, 'w') as f:
                json.dump(workflow_data, f, indent=2)
            
            logger.info(f"Generated workflow: {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to generate workflow {template_name}: {e}")
            return False
    
    def list_templates(self) -> List[str]:
        """List available templates"""
        templates = []
        for file in self.templates_dir.glob("*.template.json"):
            templates.append(file.stem.replace('.template', ''))
        return sorted(templates)

@click.group()
@click.option('--config', '-c', default='.env', help='Configuration file path')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
@click.pass_context
def cli(ctx, config, verbose):
    """Earth Agents N8N CLI Tool"""
    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Load configuration
    config_path = Path(config)
    if config_path.exists():
        # Load environment variables from file
        with open(config_path) as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    # Initialize context
    ctx.ensure_object(dict)
    ctx.obj['config'] = {
        'n8n_url': os.getenv('N8N_URL', 'http://localhost:5678'),
        'n8n_user': os.getenv('N8N_BASIC_AUTH_USER', 'admin'),
        'n8n_password': os.getenv('N8N_BASIC_AUTH_PASSWORD', 'password'),
        'earth_agents_url': os.getenv('EARTH_AGENTS_API_URL', 'http://localhost:8080'),
        'earth_agents_key': os.getenv('EARTH_AGENTS_API_KEY'),
        'environment': os.getenv('EARTH_AGENTS_ENV', 'development')
    }

@cli.command()
@click.option('--specialist', '-s', required=True, help='Specialist name')
@click.option('--prompt', '-p', required=True, help='Prompt for specialist')
@click.option('--context', '-c', help='Context JSON file')
@click.option('--output', '-o', help='Output file for results')
@click.pass_context
def invoke(ctx, specialist, prompt, context, output):
    """Invoke an Earth Agents specialist"""
    config = ctx.obj['config']
    
    # Initialize API client
    api = EarthAgentsAPI(config['earth_agents_url'], config['earth_agents_key'])
    
    # Load context if provided
    context_data = {}
    if context:
        with open(context, 'r') as f:
            context_data = json.load(f)
    
    try:
        # Invoke specialist
        result = api.invoke_specialist(specialist, prompt, context_data)
        
        # Output results
        if output:
            with open(output, 'w') as f:
                json.dump(result, f, indent=2)
            click.echo(f"Results written to: {output}")
        else:
            click.echo(json.dumps(result, indent=2))
            
    except requests.exceptions.RequestException as e:
        click.echo(f"Error invoking specialist: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.pass_context
def specialists(ctx):
    """List available specialists"""
    config = ctx.obj['config']
    
    api = EarthAgentsAPI(config['earth_agents_url'], config['earth_agents_key'])
    
    try:
        specialists_list = api.get_specialist_list()
        
        click.echo("Available specialists:")
        for specialist in specialists_list:
            click.echo(f"  - {specialist}")
            
    except requests.exceptions.RequestException as e:
        click.echo(f"Error fetching specialists: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.option('--template', '-t', required=True, help='Template name')
@click.option('--output', '-o', required=True, help='Output workflow file')
@click.option('--env-file', help='Environment variables file')
@click.pass_context
def generate(ctx, template, output, env_file):
    """Generate workflow from template"""
    config = ctx.obj['config']
    
    # Load additional environment variables
    env_vars = {}
    if env_file:
        with open(env_file, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env_vars[key] = value
    
    # Initialize generator
    templates_dir = Path('templates')
    generator = WorkflowGenerator(templates_dir, config)
    
    # Generate workflow
    output_path = Path(output)
    if generator.generate_workflow(template, output_path, env_vars):
        click.echo(f"Generated workflow: {output_path}")
    else:
        click.echo(f"Failed to generate workflow from template: {template}", err=True)
        sys.exit(1)

@cli.command()
@click.pass_context
def templates(ctx):
    """List available workflow templates"""
    templates_dir = Path('templates')
    
    if not templates_dir.exists():
        click.echo("Templates directory not found")
        return
    
    generator = WorkflowGenerator(templates_dir, {})
    templates_list = generator.list_templates()
    
    if templates_list:
        click.echo("Available templates:")
        for template in templates_list:
            click.echo(f"  - {template}")
    else:
        click.echo("No templates found")

@cli.command()
@click.pass_context
def workflows(ctx):
    """List N8N workflows"""
    config = ctx.obj['config']
    
    api = N8NAPI(config['n8n_url'], config['n8n_user'], config['n8n_password'])
    
    try:
        workflows_list = api.get_workflows()
        
        click.echo(f"Found {len(workflows_list)} workflows:")
        for workflow in workflows_list:
            status = "✅ Active" if workflow.get('active') else "❌ Inactive"
            click.echo(f"  {workflow['id']}: {workflow['name']} - {status}")
            
    except requests.exceptions.RequestException as e:
        click.echo(f"Error fetching workflows: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.option('--workflow-id', '-w', required=True, help='Workflow ID')
@click.option('--data', '-d', help='Input data JSON file')
@click.pass_context
def execute(ctx, workflow_id, data):
    """Execute N8N workflow"""
    config = ctx.obj['config']
    
    api = N8NAPI(config['n8n_url'], config['n8n_user'], config['n8n_password'])
    
    # Load input data if provided
    input_data = {}
    if data:
        with open(data, 'r') as f:
            input_data = json.load(f)
    
    try:
        result = api.execute_workflow(workflow_id, input_data)
        click.echo(json.dumps(result, indent=2))
        
    except requests.exceptions.RequestException as e:
        click.echo(f"Error executing workflow: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.option('--workflow-id', '-w', required=True, help='Workflow ID')
@click.pass_context
def activate(ctx, workflow_id):
    """Activate N8N workflow"""
    config = ctx.obj['config']
    
    api = N8NAPI(config['n8n_url'], config['n8n_user'], config['n8n_password'])
    
    try:
        result = api.activate_workflow(workflow_id)
        click.echo(f"Workflow {workflow_id} activated successfully")
        
    except requests.exceptions.RequestException as e:
        click.echo(f"Error activating workflow: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.option('--service', help='Check specific service')
@click.pass_context
def health(ctx, service):
    """Check system health"""
    config = ctx.obj['config']
    
    services = {
        'n8n': config['n8n_url'],
        'earth-agents': config['earth_agents_url']
    }
    
    if service:
        if service not in services:
            click.echo(f"Unknown service: {service}", err=True)
            sys.exit(1)
        services = {service: services[service]}
    
    all_healthy = True
    
    for name, url in services.items():
        try:
            health_url = f"{url}/healthz" if name == 'n8n' else f"{url}/health"
            response = requests.get(health_url, timeout=10)
            
            if response.status_code == 200:
                click.echo(f"✅ {name}: Healthy")
            else:
                click.echo(f"❌ {name}: Unhealthy (HTTP {response.status_code})")
                all_healthy = False
                
        except requests.exceptions.RequestException as e:
            click.echo(f"❌ {name}: Unreachable ({e})")
            all_healthy = False
    
    if not all_healthy:
        sys.exit(1)

@cli.command()
@click.option('--output', '-o', default='backup.json', help='Backup file')
@click.pass_context
def backup(ctx, output):
    """Backup workflows and configuration"""
    try:
        # Run backup script
        result = subprocess.run(
            ['./scripts/backup.sh', '--output', output],
            check=True,
            capture_output=True,
            text=True
        )
        click.echo(f"Backup completed: {output}")
        
    except subprocess.CalledProcessError as e:
        click.echo(f"Backup failed: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.option('--backup-file', '-b', required=True, help='Backup file to restore')
@click.pass_context
def restore(ctx, backup_file):
    """Restore workflows and configuration"""
    try:
        # Run restore script
        result = subprocess.run(
            ['./scripts/restore.sh', '--input', backup_file],
            check=True,
            capture_output=True,
            text=True
        )
        click.echo(f"Restore completed from: {backup_file}")
        
    except subprocess.CalledProcessError as e:
        click.echo(f"Restore failed: {e}", err=True)
        sys.exit(1)

@cli.command()
@click.option('--follow', '-f', is_flag=True, help='Follow log output')
@click.option('--lines', '-n', default=100, help='Number of lines to show')
@click.pass_context
def logs(ctx, follow, lines):
    """View system logs"""
    cmd = ['docker-compose', 'logs']
    
    if follow:
        cmd.append('-f')
    
    cmd.extend(['--tail', str(lines)])
    
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        click.echo(f"Failed to view logs: {e}", err=True)
        sys.exit(1)

if __name__ == '__main__':
    cli()